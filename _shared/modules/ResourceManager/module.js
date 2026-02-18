/**
 * @module Shared
 */


/**
 * I am the ResourceManager.
 *
 * I contain the business logic for managing all Resources and rendering lists of them for display.
 *
 * I am closely connected with {{#crossLink "ViewResource"}}ViewResource{{/crossLink}}.
 *
 * @class ResourceManager
 * @static
 */


FrameTrail.defineModule('ResourceManager', function(FrameTrail){

	var labels = FrameTrail.module('Localization').labels;

    var maxUploadBytes,
        tmpObj,
        previewXHR,
        uploadQueue = [],
        completedUploads = [],
        isUploading = false,
        currentUploadDialog = null,
        currentSuccessCallback = null,
        mediaOptimizationConfig = {
            enabled: false,
            ffmpegEnabled: false,
            ffmpegAvailable: false
        };


	/**
	 * Add a resource entry to the local _index.json and optionally store a file.
	 * @method addResourceLocally
	 * @param {Object} resourceObj - The resource data object (src, type, name, thumb, attributes, etc.)
	 * @param {File|Blob} [fileBlob] - Optional file to store in resources/
	 * @param {String} [thumbDataUrl] - Optional base64 data URL for thumbnail
	 * @return {Promise<Object>} The response with resId and resource
	 * @private
	 */
	function addResourceLocally(resourceObj, fileBlob, thumbDataUrl) {
		var adapter = FrameTrail.module('StorageManager').getAdapter();
		var userInfo = adapter.userInfo;

		// Fill in creator info
		resourceObj.creator = userInfo.name || 'Local User';
		resourceObj.creatorId = userInfo.id || 'local';
		resourceObj.created = Math.floor(Date.now() / 1000);

		return adapter.readJSON('resources/_index.json').catch(function() {
			return { 'resources-increment': 0, 'resources': {} };
		}).then(function(indexData) {
			if (!indexData['resources-increment']) {
				indexData['resources-increment'] = 0;
			}
			indexData['resources-increment']++;
			var newId = indexData['resources-increment'];
			indexData['resources'][newId] = resourceObj;

			var tasks = [adapter.writeJSON('resources/_index.json', indexData)];

			// Store file if provided
			if (fileBlob && resourceObj.src && resourceObj.type !== 'url') {
				tasks.push(adapter.writeFile('resources/' + resourceObj.src, fileBlob));
			}

			// Store thumbnail if provided as data URL
			if (thumbDataUrl && resourceObj.thumb) {
				tasks.push(adapter.writeDataUrl('resources/' + resourceObj.thumb, thumbDataUrl));
			}

			return Promise.all(tasks).then(function() {
				return { resId: newId, resource: resourceObj };
			});
		});
	}

	/**
	 * Upload a single file locally via File System Access API.
	 * @method uploadSingleFileLocally
	 * @param {File} file
	 * @param {String} type
	 * @param {Function} callback - callback(success, errorMessage)
	 * @private
	 */
	function uploadSingleFileLocally(file, type, callback) {
		var fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
		var fileExt = file.name.split('.').pop().toLowerCase();
		var timestamp = Date.now();
		var adapter = FrameTrail.module('StorageManager').getAdapter();
		var userInfo = adapter.userInfo;
		var userId = userInfo.id || 'local';
		var storedName = (userId + '_' + timestamp + '_' + sanitizeFilename(fileName)).substring(0, 90) + '.' + fileExt;

		var resourceObj = {
			name: fileName,
			src: storedName,
			type: type,
			attributes: {}
		};

		// For video, force .mp4 extension in stored name
		if (type === 'video') {
			storedName = (userId + '_' + timestamp + '_' + sanitizeFilename(fileName)).substring(0, 90) + '.mp4';
			resourceObj.src = storedName;
		}

		// For audio, force .mp3 extension
		if (type === 'audio') {
			storedName = (userId + '_' + timestamp + '_' + sanitizeFilename(fileName)).substring(0, 90) + '.mp3';
			resourceObj.src = storedName;
		}

		addResourceLocally(resourceObj, file).then(function() {
			callback(true);
		}).catch(function(err) {
			callback(false, 'Local save failed: ' + err.message);
		});
	}

	/**
	 * Sanitize a filename for local storage.
	 * @method sanitizeFilename
	 * @param {String} name
	 * @return {String}
	 * @private
	 */
	function sanitizeFilename(name) {
		return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
	}

	/**
	 * Handle the traditional single-file upload form submission in local mode.
	 * Reads form fields and saves the resource locally.
	 * @method submitFormLocally
	 * @param {jQuery} uploadDialog
	 * @param {Function} successCallback
	 * @private
	 */
	function submitFormLocally(uploadDialog, successCallback) {
		var tmpType = uploadDialog.find('.nameInputContainer input[name="type"]').val();
		var resourceName = uploadDialog.find('.nameInputContainer input[name="name"]').val();

		if (!resourceName || resourceName.length < 1) {
			$('.uploadDialog').append('<div class="message active error">'+ labels['ErrorEmptyName'] +'</div>');
			return;
		}

		uploadDialog.find('.progress').show();
		uploadDialog.find('.bar').width('50%');
		uploadDialog.find('.percent').html('50%');
		uploadDialog.find('.uploadStatus').html('Saving...');
		$('.newResourceConfirm').prop('disabled', true);

		if (tmpType === 'url') {
			// URL resource — no file to store
			var tmpObj = checkResourceInput(
				uploadDialog.find('.resourceInput').val(),
				uploadDialog.find('.resourceNameInput').val(),
				uploadDialog.find('.resourceInput[name="thumbnail"]').val()
			);
			if (!tmpObj || !tmpObj.src) {
				uploadDialog.find('.progress').hide();
				$('.newResourceConfirm').prop('disabled', false);
				$('.uploadDialog').append('<div class="message active error">'+ labels['ErrorEmptyURL'] +'</div>');
				return;
			}
			tmpObj.name = resourceName;
			addResourceLocally(tmpObj).then(function() {
				uploadDialog.find('.bar').width('100%');
				uploadDialog.find('.percent').html('100%');
				FrameTrail.module('Database').loadResourceData(function() {
					uploadDialog.dialog('close');
					successCallback && successCallback.call();
				});
			}).catch(function(err) {
				uploadDialog.find('.progress').hide();
				$('.newResourceConfirm').prop('disabled', false);
				$('.uploadDialog').append('<div class="message active error">Save failed: ' + err.message + '</div>');
			});

		} else if (tmpType === 'map') {
			// Map resource — no file, just coordinates
			var lat = uploadDialog.find('input[name="lat"]').val();
			var lon = uploadDialog.find('input[name="lon"]').val();
			if (!lat || !lon) {
				uploadDialog.find('.progress').hide();
				$('.newResourceConfirm').prop('disabled', false);
				$('.uploadDialog').append('<div class="message active error">'+ labels['ErrorMapNoCoordinates'] +'</div>');
				return;
			}
			var mapResource = {
				name: resourceName,
				src: '',
				type: 'location',
				attributes: {
					lat: lat,
					lon: lon,
					boundingBox: [
						uploadDialog.find('input.BB1').val(),
						uploadDialog.find('input.BB2').val(),
						uploadDialog.find('input.BB3').val(),
						uploadDialog.find('input.BB4').val()
					]
				}
			};
			addResourceLocally(mapResource).then(function() {
				uploadDialog.find('.bar').width('100%');
				uploadDialog.find('.percent').html('100%');
				FrameTrail.module('Database').loadResourceData(function() {
					uploadDialog.dialog('close');
					successCallback && successCallback.call();
				});
			}).catch(function(err) {
				uploadDialog.find('.progress').hide();
				$('.newResourceConfirm').prop('disabled', false);
				$('.uploadDialog').append('<div class="message active error">Save failed: ' + err.message + '</div>');
			});

		} else {
			// File upload (image, video, audio, pdf)
			var fileInput = uploadDialog.find('#resourceInputTab' + tmpType.charAt(0).toUpperCase() + tmpType.slice(1) + ' input[type="file"]');
			var file = fileInput[0] && fileInput[0].files[0];
			if (!file) {
				uploadDialog.find('.progress').hide();
				$('.newResourceConfirm').prop('disabled', false);
				$('.uploadDialog').append('<div class="message active error">No file selected.</div>');
				return;
			}

			uploadSingleFileLocally(file, tmpType, function(success, error) {
				if (success) {
					uploadDialog.find('.bar').width('100%');
					uploadDialog.find('.percent').html('100%');
					FrameTrail.module('Database').loadResourceData(function() {
						uploadDialog.dialog('close');
						successCallback && successCallback.call();
					});
				} else {
					uploadDialog.find('.progress').hide();
					$('.newResourceConfirm').prop('disabled', false);
					$('.uploadDialog').append('<div class="message active error">' + (error || 'Upload failed') + '</div>');
				}
			});
		}
	}

	/**
	 * I tell the {{#crossLink "Database/loadResourceData:method"}}Database{{/crossLink}} to reload the index data.
	 * @method updateResourceDatabase
	 */
	function updateResourceDatabase() {

		FrameTrail.module('Database').loadResourceData();

	};



	//Check for valid URL
    var previewTimeout = null;
    $(document).on('change paste keyup', '#resourceInputTabURL input', function(evt) {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(function() {
            $('#resourceInputTabURL .resourceURLPreview').empty();
            $('.resourceInput[name="thumbnail"]').val('');
            checkResourceInput( $('#resourceInputTabURL input')[0].value, $('.resourceNameInput')[0].value );
        }, 800);
        evt.stopPropagation();
    });

    //Check for Name Length
    $(document).on('change paste keyup input', '.resourceNameInput', function(evt) {
        if ( $(this).val().length > 2 ) {
            $('.newResourceConfirm').button('enable');
        } else {
            $('.newResourceConfirm').button('disable');
        }
        $('.resourceURLPreview .resourceTitle').text($(this).val());
        evt.stopPropagation();
    });



	/**
	 * Detect resource type from file object
	 * @method detectResourceType
	 * @param {File} file
	 * @return {Object} {type: string, needsTranscoding: boolean, canUpload: boolean, error: string}
	 */
	function detectResourceType(file) {
		var mimeType = file.type;
		var fileName = file.name.toLowerCase();
		var result = {
			type: null,
			needsTranscoding: false,
			canUpload: true,
			error: null
		};

		// Image detection
		if (mimeType.indexOf('image/') === 0 || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
			result.type = 'image';
			return result;
		}

		// PDF detection
		if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)) {
			result.type = 'pdf';
			return result;
		}

		// Video detection
		if (mimeType.indexOf('video/') === 0 || /\.(mp4|mov|avi|webm|m4v|mkv|flv)$/i.test(fileName)) {
			result.type = 'video';
			// Check if it's already MP4
			if (mimeType === 'video/mp4' || /\.mp4$/i.test(fileName)) {
				result.needsTranscoding = false;
			} else {
				// Other video formats need transcoding
				result.needsTranscoding = true;
				// Check if FFmpeg is available for transcoding
					if (mediaOptimizationConfig.ffmpegEnabled && mediaOptimizationConfig.ffmpegAvailable) {
					result.canUpload = true;
					result.error = null; // Will be transcoded server-side
					} else {
					result.canUpload = false;
					result.error = 'Video must be in MP4 format. Please convert ' + fileName + ' to MP4 before uploading.';
					}
			}
			return result;
		}

		// Audio detection
		if (mimeType.indexOf('audio/') === 0 || /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName)) {
			result.type = 'audio';
			// Check if it's already MP3
			if (mimeType === 'audio/mp3' || mimeType === 'audio/mpeg' || /\.mp3$/i.test(fileName)) {
				result.needsTranscoding = false;
			} else {
				// Other audio formats need transcoding
				result.needsTranscoding = true;
				// Check if FFmpeg is available for transcoding
				if (mediaOptimizationConfig.ffmpegEnabled && mediaOptimizationConfig.ffmpegAvailable) {
					result.canUpload = true;
					result.error = null; // Will be transcoded server-side
				} else {
					result.canUpload = false;
					result.error = 'Audio must be in MP3 format. Please convert ' + fileName + ' to MP3 before uploading.';
				}
			}
			return result;
		}

		// Unknown type
		result.canUpload = false;
		result.error = 'Unsupported file type: ' + fileName;
		return result;
	}

	/**
	 * Process upload queue - uploads files one at a time
	 * @method processUploadQueue
	 * @private
	 */
	function processUploadQueue() {
		if (isUploading || uploadQueue.length === 0) {
			return;
		}

		isUploading = true;
		var queueItem = uploadQueue[0];

		// Mark as uploading and update UI
		queueItem.status = 'uploading';
		updateQueueUI();

		// Upload the file (use local adapter when in local storage mode)
		var uploadFn = (FrameTrail.getState('storageMode') === 'local') ? uploadSingleFileLocally : uploadSingleFile;
		uploadFn(queueItem.file, queueItem.type, function(success, error) {
			// Update status
			if (success) {
				queueItem.status = 'completed';
			} else {
				queueItem.status = 'error';
				queueItem.error = error;
			}

			// Move to completed list
			completedUploads.push(uploadQueue.shift());
			isUploading = false;

			updateQueueUI();

			// Process next file
			if (uploadQueue.length > 0) {
				setTimeout(processUploadQueue, 100);
			} else {
				// All uploads complete
				finishBatchUpload();
			}
		});
	}

	/**
	 * Update the queue UI display
	 * @method updateQueueUI
	 * @private
	 */
	function updateQueueUI() {
		if (!currentUploadDialog) return;

		var queueContainer = currentUploadDialog.find('.uploadQueue');
		if (queueContainer.length === 0) return;

		queueContainer.empty();

		var completed = 0;
		var failed = 0;

		// Combine completed and pending uploads for display
		var allItems = completedUploads.concat(uploadQueue);

		allItems.forEach(function(item, index) {
			var statusClass = item.status || 'pending';
			var statusText = item.status === 'error' ? (item.error || 'Failed') :
			                 item.status === 'completed' ? 'Completed' :
			                 item.status === 'uploading' ? 'Uploading...' : 'Pending';

			if (item.status === 'completed') completed++;
			if (item.status === 'error') failed++;

			var queueRow = $('<div class="queueRow ' + statusClass + '">' +
			                 '<span class="fileName">' + item.file.name + '</span>' +
			                 '<span class="fileSize">' + bytesToSize(item.file.size) + '</span>' +
			                 '<span class="fileType">' + (item.type || '?') + '</span>' +
			                 '<span class="status">' + statusText + '</span>' +
			                 '</div>');
			queueContainer.append(queueRow);
		});

		// Update summary
		var summary = currentUploadDialog.find('.queueSummary');
		if (summary.length > 0) {
			var total = allItems.length;
			summary.text('Uploading: ' + completed + ' of ' + total + ' files' +
			            (failed > 0 ? ' (' + failed + ' failed)' : ''));
		}
	}

	/**
	 * Finish batch upload and reload resources
	 * @method finishBatchUpload
	 * @private
	 */
	function finishBatchUpload() {
		FrameTrail.module('Database').loadResourceData(function() {
			if (currentUploadDialog) {
				currentUploadDialog.find('.queueSummary').text('All uploads complete!');

				// Update button text to "Close" using jQuery UI button API
				var buttons = currentUploadDialog.dialog('option', 'buttons');
				buttons[0].text = 'Close';
				currentUploadDialog.dialog('option', 'buttons', buttons);
				currentUploadDialog.closest('.ui-dialog').find('.newResourceConfirm').prop('disabled', false);

				// Call success callback if provided
				if (currentSuccessCallback) {
					currentSuccessCallback.call();
				}
			}
		});
	}

	/**
	 * Upload a single file
	 * @method uploadSingleFile
	 * @param {File} file
	 * @param {String} type
	 * @param {Function} callback
	 * @private
	 */
	function uploadSingleFile(file, type, callback) {
		// Generate a unique name from filename
		var fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

		var formData = new FormData();
		formData.append('a', 'fileUpload');
		formData.append('name', fileName);
		formData.append('type', type);

		if (type === 'image') {
			formData.append('image', file);
		} else if (type === 'video') {
			formData.append('mp4', file);
		} else if (type === 'audio') {
			formData.append('audio', file);
		} else if (type === 'pdf') {
			formData.append('pdf', file);
		}

		$.ajax({
			url: '_server/ajaxServer.php',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: function(response) {
				if (response.code === 0) {
					callback(true);
				} else {
					callback(false, 'Upload failed: ' + (response.string || 'Unknown error'));
				}
			},
			error: function() {
				callback(false, 'Network error');
			}
		});
	}

	/**
	 * I open a jquery UI dialog, which allows the user to upload a new resource.
     * When the onlyVideo parameter is set to true, I allow only uploads of videos (needed during creation of a new hypervideo)
	 *
	 * @method uploadResource
	 * @param {Function} successCallback
     * @param {Boolean} onlyVideo
	 *
	 */
	function uploadResource(successCallback, onlyVideo) {
        FrameTrail.module('UserManagement').ensureAuthenticated(function(){

            var isLocalMode = (FrameTrail.getState('storageMode') === 'local');

            function showUploadDialog() {

                    var uploadDialog =  $('<div class="uploadDialog" title="'+ labels['ResourceAddNew'] +'">'
                                        + '    <div class="dropZoneContainer">'
                                        + '        <div class="dropZone">'
                                        + '            <div class="dropZoneContent">'
                                        + '                <span class="icon-upload"></span>'
                                        + '                <p>Drag and drop files here</p>'
                                        + '                <p class="dropZoneHint">or use the tabs below to upload</p>'
                                        + '            </div>'
                                        + '        </div>'
                                        + '        <div class="uploadQueue"></div>'
                                        + '        <div class="queueSummary"></div>'
                                        + '    </div>'
                                        + '    <form class="uploadForm" method="post">'
                                        + '        <div class="resourceInputTabContainer">'
                                        + '            <ul class="resourceInputTabList">'
                                        + '                <li data-type="url"><a href="#resourceInputTabURL">'+ labels['ResourcePasteURL'] +'</a></li>'
                                        + '                <li data-type="image"><a href="#resourceInputTabImage">'+ labels['ResourceUploadImage'] +'</a></li>'
                                        + '                <li data-type="video"><a href="#resourceInputTabVideo">'+ labels['ResourceUploadVideo'] +'</a></li>'
                                        + '                <li data-type="audio"><a href="#resourceInputTabAudio">'+ labels['ResourceUploadAudio'] +'</a></li>'
                                        + '                <li data-type="pdf"><a href="#resourceInputTabPDF">'+ labels['ResourceUploadPDF'] +'</a></li>'
                                        + '                <li data-type="map"><a href="#resourceInputTabMap">'+ labels['ResourceAddMap'] +'</a></li>'
                                        + '            </ul>'
                                        + '            <div id="resourceInputTabURL">'
                                        + '                <div class="resourceInputMessage message active">'+ labels['MessagePasteAnyURL'] +'</div>'
                                        + '                <input type="text" name="url" placeholder="URL" class="resourceInput">'
                                        + '                <input type="hidden" name="thumbnail" class="resourceInput">'
                                        + '                <input type="hidden" name="embed" class="resourceInput">'
                                        + '                <div class="corsWarning message warning">'+ labels['MessageEmbedNotAllowed'] +'</div>'
                                        + '                <div class="resourceURLPreview"></div>'
                                        + '            </div>'
                                        + '            <div id="resourceInputTabImage">'
                                        + '                <div class="message active">'+ labels['MessageAddImageFileFormat'] +' <b>3 MB</b></div>'
                                        + '                <input type="file" name="image">'
                                        + '            </div>'
                                        + '            <div id="resourceInputTabVideo">'
                                        + '                <div class="videoInputMessage message active">'+ labels['MessageAddVideoFileFormat'] +' <b>'+ bytesToSize(maxUploadBytes) +'</b>.<br>'+ labels['MessageMoreInfoVideoConversion'] +'</div>'
                                        + '                <input type="file" name="mp4"> .mp4'
                                        + '            </div>'
                                        + '            <div id="resourceInputTabAudio">'
                                        + '                <div class="audioInputMessage message active">'+ labels['MessageAddAudioFileFormat'] +' <b>3 MB</b>.</div>'
                                        + '                <input type="file" name="audio"> .mp3'
                                        + '            </div>'
                                        + '            <div id="resourceInputTabPDF">'
                                        + '                <div class="pdfInputMessage message active">'+ labels['MessageAddPDFFileFormat'] +' <b>3 MB</b>.</div>'
                                        + '                <input type="file" name="pdf"> .pdf'
                                        + '            </div>'
                                        + '            <div id="resourceInputTabMap">'
                                        + '                <div class="locationSearchWrapper">'
                                        + '                    <input type="text" name="locationQ" class="locationQ" placeholder="'+ labels['LocationSearch'] +'">'
                                        + '                    <span class="locationSearchCopyright">Data © OpenStreetMap contributors, ODbL 1.0.</span>'
                                        + '                    <ul class="locationSearchSuggestions"></ul>'
                                        + '                </div>'
                                        + '                <input type="text" name="lat" placeholder="latitude">'
                                        + '                <input type="text" name="lon" placeholder="longitude">'
                                        + '                <input type="hidden" name="boundingBox[]" class="BB1">'
                                        + '                <input type="hidden" name="boundingBox[]" class="BB2">'
                                        + '                <input type="hidden" name="boundingBox[]" class="BB3">'
                                        + '                <input type="hidden" name="boundingBox[]" class="BB4">'
                                        + '            </div>'
                                        + '        </div>'
                                        + '        <div class="nameInputContainer">'
                                        + '            <div class="nameInputMessage">Name</div>'
                                        + '            <input type="text" name="name" placeholder="'+ labels['MessageNewResourceName'] +'" class="resourceNameInput">'
                                        + '            <input type="hidden" name="a" value="fileUpload">'
                                        + '            <input type="hidden" name="attributes" value="">'
                                        + '            <input type="hidden" name="type" value="url">'
                                        + '        </div>'
                                        + '    </form>'
                                        + '    <div class="progress">'
                                        + '        <div class="bar"></div >'
                                        + '        <div class="percent">0%</div >'
                                        + '        <div class="uploadStatus"></div>'
                                        + '    </div>'
                                        + '</div>'

                                        + '</div>');

                    // Store reference to current dialog and callback
                    currentUploadDialog = uploadDialog;
                    currentSuccessCallback = successCallback;

                    // Setup drag and drop zone
                    var dropZone = uploadDialog.find('.dropZone');

                    dropZone.on('dragover', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).addClass('dragover');
                    });

                    dropZone.on('dragleave', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).removeClass('dragover');
                    });

                    dropZone.on('drop', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).removeClass('dragover');

                        var files = e.originalEvent.dataTransfer.files;
                        if (files.length > 0) {
                            handleFilesDrop(files);
                        }
                    });

                    // Also handle click to open file picker
                    dropZone.on('click', function() {
                        var input = $('<input type="file" multiple style="display:none">');
                        input.on('change', function() {
                            if (this.files.length > 0) {
                                handleFilesDrop(this.files);
                            }
                        });
                        input.click();
                    });

                    /**
                     * Handle files dropped or selected
                     */
                    function handleFilesDrop(files) {
                        uploadQueue = [];
                        completedUploads = [];
                        var errors = [];

                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];

                            // Check file size
                            if (file.size > maxUploadBytes) {
                                errors.push(file.name + ' exceeds maximum size of ' + bytesToSize(maxUploadBytes));
                                continue;
                            }

                            // Detect file type
                            var detection = detectResourceType(file);

                            if (!detection.canUpload) {
                                errors.push(detection.error);
                                continue;
                            }

                            // Add to queue
                            uploadQueue.push({
                                file: file,
                                type: detection.type,
                                status: 'pending',
                                error: null
                            });
                        }

                        // Show errors if any
                        if (errors.length > 0) {
                            uploadDialog.find('.message.error').remove();
                            $('.uploadDialog').append('<div class="message active error">' + errors.join('<br>') + '</div>');
                        }

                        // If we have files to upload, show queue and start
                        if (uploadQueue.length > 0) {
                            uploadDialog.find('.dropZoneContainer').addClass('hasQueue');
                            uploadDialog.find('.uploadQueue').show();
                            uploadDialog.find('.queueSummary').show();
                            updateQueueUI();

                            // Hide traditional upload form
                            uploadDialog.find('.uploadForm').hide();

                            // Enable upload button and change text to "Start Upload"
                            setTimeout(function() {
                                var buttons = uploadDialog.dialog('option', 'buttons');
                                buttons[0].text = 'Start Upload';
                                uploadDialog.dialog('option', 'buttons', buttons);
                                uploadDialog.closest('.ui-dialog').find('.newResourceConfirm').prop('disabled', false);
                            }, 100);
                        }
                    }

                    uploadDialog.find('input[type="file"]').on('change', function() {

                        if (this.files[0].size > maxUploadBytes) {
                            uploadDialog.find('.newResourceConfirm').prop('disabled', true);
                            $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorFileSize'] +'. '+ labels['ErrorFileSizeMax'] +' '+ bytesToSize(maxUploadBytes) +'. <br>'+ labels['ErrorFileSizeMoreInfo'] +'</div>');
                        } else {
                            uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                            uploadDialog.find('.message.error').remove();

                        }

                    });

                    uploadDialog.find('.resourceInputTabContainer').tabs({
                        activate: function(e,ui) {

                            uploadDialog.find('.nameInputContainer input[name="attributes"]').val('');
                            uploadDialog.find('.nameInputContainer input[name="type"]').val($(ui.newTab[0]).data('type'));
                            uploadDialog.find('.message.error').remove();

                        },

                        create: function(e,ui) {

                        	if (onlyVideo) {

                            	uploadDialog.find('.resourceInputTabContainer').tabs(
                            		'option',
                            		'active',
                            		uploadDialog.find('#resourceInputTabVideo').index() - 1
                            	);

                            	uploadDialog.find('.resourceInputTabContainer').tabs('disable');
                            	uploadDialog.find('.resourceInputTabContainer').tabs('enable', '#resourceInputTabVideo');

                            }


                        }

                    });

                    uploadDialog.find('.locationQ').keyup(function(e) {

                        $.getJSON('https://nominatim.openstreetmap.org/search?q='+ uploadDialog.find('.locationQ').val() + '&format=json')
                            .done(function(respText) {

                                uploadDialog.find('.locationSearchSuggestions').empty();
                                uploadDialog.find('.locationSearchSuggestions').show();

                                for (var location in respText) {

                                    var suggestion = $('<li data-lon="'+ respText[location].lon +'" data-lat="'+ respText[location].lat +'" data-display-name="'+ respText[location].display_name +'" data-bb1="'+ respText[location].boundingbox[0] +'" data-bb2="'+ respText[location].boundingbox[1] +'" data-bb3="'+ respText[location].boundingbox[2] +'" data-bb4="'+ respText[location].boundingbox[3] +'">'+ respText[location].display_name +'</li>')
                                        .click(function() {
                                            uploadDialog.find('input[name="lon"]').val( $(this).attr('data-lon') );
                                            uploadDialog.find('input[name="lat"]').val( $(this).attr('data-lat') );
                                            uploadDialog.find('input.BB1').val( $(this).attr('data-bb1') );
                                            uploadDialog.find('input.BB2').val( $(this).attr('data-bb2') );
                                            uploadDialog.find('input.BB3').val( $(this).attr('data-bb3') );
                                            uploadDialog.find('input.BB4').val( $(this).attr('data-bb4') );
                                            uploadDialog.find('input[name="name"]').val( $(this).attr('data-display-name') );
                                            uploadDialog.find('.locationSearchSuggestions').hide();
                                        })
                                        .appendTo( uploadDialog.find('.locationSearchSuggestions') );
                                }
                                //console.log(respText);
                            });

                    });



                    //Ajaxform
                    uploadDialog.find('.uploadForm').ajaxForm({
                        method:     'POST',
                        url:        '_server/ajaxServer.php',
                        beforeSerialize: function() {

                            if (previewXHR) { previewXHR.abort() };

                            uploadDialog.find('.message.error').remove();

                            var tmpType = uploadDialog.find('.nameInputContainer input[name="type"]').val();

                            if (tmpType == 'url') {
                                tmpObj = checkResourceInput( uploadDialog.find('.resourceInput').val(), uploadDialog.find('.resourceNameInput').val(), uploadDialog.find('.resourceInput[name="thumbnail"]').val() );
                                uploadDialog.find('.nameInputContainer input[name="attributes"]').val(JSON.stringify(tmpObj));
                                tmpObj = [];
                            }

                            else if (tmpType == 'image') {
                                uploadDialog.find('#resourceInputTabVideo input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabPDF input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabAudio input').prop('disabled',true);
                            }

                            else if (tmpType == 'video') {
                                uploadDialog.find('#resourceInputTabImage input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabPDF input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabAudio input').prop('disabled',true);
                            }

                            else if (tmpType == 'audio') {
                                uploadDialog.find('#resourceInputTabImage input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabVideo input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabPDF input').prop('disabled',true);
                            }

                            else if (tmpType == 'pdf') {
                                uploadDialog.find('#resourceInputTabImage input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabVideo input').prop('disabled',true);
                                uploadDialog.find('#resourceInputTabAudio input').prop('disabled',true);
                            }

                            else if (tmpType == 'map') {
                                uploadDialog.find('.nameInputContainer input[name="attributes"]').val('{}');
                            }

                            var percentVal = '0%';

                            uploadDialog.find('.bar').width(percentVal);
                            uploadDialog.find('.percent').html(percentVal);
                            uploadDialog.find('.uploadStatus').html('Uploading Resource ...');
                            uploadDialog.find('.progress').show();

                            $('.newResourceConfirm').prop('disabled', true);

                        },
                        beforeSend: function(xhr) {
                            var tmpType = uploadDialog.find('.nameInputContainer input[name="type"]').val();

                            // client side pre-validation (server checks again)
                            if (tmpType == 'video') {
                                if( uploadDialog.find('[name="mp4"]').val().length < 4) {
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorChooseVideoFile'] +'</div>');
                                    xhr.abort();
                                }

                            }

                        },
                        data: tmpObj,
                        uploadProgress: function(event, position, total, percentComplete) {

                            var percentVal = percentComplete + '%';

                            uploadDialog.find('.bar').width(percentVal)
                            uploadDialog.find('.percent').html(percentVal);

                        },
                        success: function(respText) {

                            var percentVal = '100%';

                            uploadDialog.find('.bar').width(percentVal)
                            uploadDialog.find('.percent').html(percentVal);

                            switch (respText['code']) {
                                case 0:

                                    // Upload Successful

                                    if (respText['response']['resource']['type'] == 'video' && FrameTrail.module('RouteNavigation').getResourceURL(respText.response.resource.src).indexOf('.m3u8') == -1) {

                                        uploadDialog.find('.uploadStatus').html(labels['MessageGeneratingThumbnail']);

                                        var tmpVideo = $('<video id="tmpVideo" style="visibility: hidden;​ height:​ 300px;​ width:​ 400px;​ position:​ absolute;​">​</video>​');
                                        var tmpCanvas = $('<canvas id="tmpCanvas" width="400px" height="300px" style="visibility: hidden; position: absolute;"></canvas>');
                                        $('body').append(tmpVideo);
                                        $('body').append(tmpCanvas);
                                        var video = document.getElementById('tmpVideo');
                                        var canvas = document.getElementById('tmpCanvas');

                                        if ( (video.canPlayType('video/mp4') || (video.canPlayType('video/mpeg4'))) ) {
                                            video.src = FrameTrail.module('RouteNavigation').getResourceURL(respText.response.resource.src);
                                        } else {
                                            console.log(labels['MessageThumbnailNotGenerated']);
                                        }

                                        video.addEventListener('loadeddata', function() {
                                            // Go to middle & Play
                                            video.currentTime = video.duration/2;
                                            video.play();
                                        });

                                        video.addEventListener('playing', function() {
                                            // Adapt and adjust Video & Canvas Dimensions
                                            //video.width = canvas.width = video.offsetWidth;
                                            //video.height = canvas.height = video.offsetHeight;
                                            // Draw current Video-Frame on Canvas
                                            canvas.getContext('2d').drawImage(video, 0, 0, 400, 300);
                                            video.pause();

                                            try {
                                                canvas.toDataURL();

                                                $.ajax({
                                                    url:        '_server/ajaxServer.php',
                                                    type:       'post',
                                                    data:       {'a':'fileUploadThumb','resourcesID':respText['response']['resId'],'type':respText['response']['resource']['type'],'thumb':canvas.toDataURL()},
                                                    /**
                                                     * Description
                                                     * @method success
                                                     * @return
                                                     */
                                                    success: function() {
                                                        $(video).remove();
                                                        $(canvas).remove();

                                                        //addResource(respText["res"]);
                                                        FrameTrail.module('Database').loadResourceData(function() {
                                                            uploadDialog.dialog('close');
                                                            successCallback && successCallback.call();
                                                        });
                                                    }
                                                });
                                            } catch(error) {
                                                $(image).remove();
                                                $(canvas).remove();

                                                FrameTrail.module('Database').loadResourceData(function() {
                                                    uploadDialog.dialog('close');
                                                    successCallback && successCallback.call();
                                                });
                                            }
                                        });

                                    } else if (respText['response']['resource']['type'] == 'image'
                                                && (/\.(jpg|jpeg|png)$/i.exec(respText['response']['resource']['src'])) ) {

                                        uploadDialog.find('.uploadStatus').html(labels['MessageGeneratingThumbnail']);

                                        var tmpImage = $('<img id="tmpImage" style="visibility: hidden;​ height:​ 250px;​ width:​350px;​ position:​ absolute;​"/>​');
                                        var tmpCanvas = $('<canvas id="tmpCanvas" width="350px" height="250px" style="visibility:hidden; position: absolute;"></canvas>');
                                        $('body').append(tmpImage);
                                        $('body').append(tmpCanvas);
                                        var image = document.getElementById('tmpImage');
                                        var canvas = document.getElementById('tmpCanvas');

                                        image.src = FrameTrail.module('RouteNavigation').getResourceURL(respText['response']['resource']['src']);
                                        image.addEventListener('load', function() {

                                            // Adapt and adjust Image & Canvas Dimensions
                                            //image.width = canvas.width = image.offsetWidth;
                                            //image.height = canvas.height = image.offsetHeight;
                                            // Draw current Image on Canvas
                                            canvas.getContext('2d').drawImage(image, 0, 0, 350, 250);

                                            try {
                                                canvas.toDataURL();

                                                $.ajax({
                                                    url:        '_server/ajaxServer.php',
                                                    type:       'post',
                                                    data:       {'a':'fileUploadThumb','resourcesID':respText['response']['resId'],'type':respText['response']['resource']['type'],'thumb':canvas.toDataURL()},
                                                    success: function() {
                                                        $(image).remove();
                                                        $(canvas).remove();

                                                        //addResource(respText["res"]);
                                                        FrameTrail.module('Database').loadResourceData(function() {
                                                            uploadDialog.dialog('close');
                                                            successCallback && successCallback.call();
                                                        });
                                                    }
                                                });
                                            } catch(error) {
                                                $(image).remove();
                                                $(canvas).remove();

                                                FrameTrail.module('Database').loadResourceData(function() {
                                                    uploadDialog.dialog('close');
                                                    successCallback && successCallback.call();
                                                });
                                            }


                                        });

                                    } else {

                                        //addResource(respText['response']);
                                        FrameTrail.module('Database').loadResourceData(function() {
                                            uploadDialog.dialog('close');
                                            successCallback && successCallback.call();
                                        });

                                    }
                                    break;
                                case 1:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorNotLoggedInAnymore'] +'</div>');
                                    break;
                                case 2:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorNotActivated'] +'</div>');
                                    break;
                                case 3:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorCouldNotFindResourcesDirectory'] +'</div>');
                                    break;
                                case 4:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorChooseImageFile'] +'</div>');
                                    break;
                                case 5:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorChooseVideoFile'] +'</div>');
                                    break;
                                case 6:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorVideoFileFormat'] +'</div>');
                                    break;
                                case 7:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorMapNoCoordinates'] +'</div>');
                                    break;
                                case 8:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorEmptyName'] +'</div>');
                                    break;
                                case 9:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorWrongType'] +'</div>');
                                    break;
                                case 10:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorFileSize'] +'. '+ labels['ErrorFileSizeMoreInfo'] +'</div>');
                                    break;
                                case 11:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorEmptyURL'] +'</div>');
                                    break;
                                case 12:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['MessageEmbedNotAllowed'] +'</div>');
                                    break;
                                case 20:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorUploadNotAllowed'] +'</div>');
                                    break;
                                default:
                                    uploadDialog.find('.progress').hide();
                                    uploadDialog.find('.newResourceConfirm').prop('disabled', false);
                                    $('.uploadDialog').append('<div class="message active error">'+ labels['ErrorGeneric'] +'</div>');
                                    break;
                            }
                        }
                    });


                    uploadDialog.dialog({
                        resizable: false,
                        width: 680,
                        height: 'auto',
                        modal: true,
                        close: function() {
                            if (previewXHR) { previewXHR.abort() };
                            // Clear queue and reset
                            uploadQueue = [];
                            completedUploads = [];
                            isUploading = false;
                            currentUploadDialog = null;
                            currentSuccessCallback = null;
                            $(this).dialog('close');
                            //$(this).find('.uploadForm').resetForm();
                            $(this).remove();
                        },
                        closeOnEscape: false,
                        buttons: [
                            {
                                class: 'newResourceConfirm',
                                text: 'Add Resource',
                                click: function() {
                                    if (previewXHR) { previewXHR.abort() };

                                    // Check if upload is complete - button should close dialog
                                    if (uploadDialog.find('.queueSummary').text().indexOf('complete') !== -1) {
                                        uploadQueue = [];
                                        completedUploads = [];
                                        isUploading = false;
                                        currentUploadDialog = null;
                                        currentSuccessCallback = null;
                                        $(this).dialog('close');
                                        return;
                                    }

                                    // Check if we're in batch upload mode
                                    if (uploadQueue.length > 0 && uploadDialog.find('.dropZoneContainer').hasClass('hasQueue')) {
                                        // Start batch upload
                                        var buttons = uploadDialog.dialog('option', 'buttons');
                                        buttons[0].text = 'Uploading...';
                                        uploadDialog.dialog('option', 'buttons', buttons);
                                        uploadDialog.closest('.ui-dialog').find('.newResourceConfirm').prop('disabled', true);
                                        processUploadQueue();
                                    } else {
                                        // Traditional single file upload
                                        if (isLocalMode) {
                                            submitFormLocally(uploadDialog, successCallback);
                                        } else {
                                            $('.uploadForm').submit();
                                        }
                                    }
                                }
                            },
                            {
                                text: 'Cancel',
                                click: function() {
                                    // Clear queue and reset
                                    uploadQueue = [];
                                    completedUploads = [];
                                    isUploading = false;
                                    currentUploadDialog = null;
                                    currentSuccessCallback = null;
                                    $(this).dialog('close');
                                }
                            }
                        ],
                        open: function( event, ui ) {
                            $('.newResourceConfirm').prop('disabled', true);
                        }
                    });

            } // End of showUploadDialog

            if (isLocalMode) {
                // Local mode: use generous defaults, no server config needed
                maxUploadBytes = 500 * 1024 * 1024; // 500 MB
                mediaOptimizationConfig = { enabled: false, ffmpegEnabled: false, ffmpegAvailable: false };
                showUploadDialog();
            } else {
                // Server mode: fetch config from server
                $.when(
                    $.ajax({
                        type: 'GET',
                        url: '_server/ajaxServer.php',
                        data: {'a':'fileGetMaxUploadSize'}
                    }),
                    $.ajax({
                        type: 'GET',
                        url: '_server/ajaxServer.php',
                        data: {'a':'fileGetMediaOptimizationConfig'}
                    })
                ).done(function(maxSizeResponse, mediaConfigResponse) {
                    maxUploadBytes = maxSizeResponse[0].maxuploadbytes;
                    if (mediaConfigResponse[0] && mediaConfigResponse[0].config) {
                        mediaOptimizationConfig = mediaConfigResponse[0].config;
                    }
                    showUploadDialog();
                });
            }

        });
    }


    /**
     * I calculate from the numeric bytesize a human readable string
     * @method bytesToSize
     * @param {Number} bytes
     * @return String
     */
    function bytesToSize(bytes) {
       var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
       if (bytes == 0) return '0 Byte';
       var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
       return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }



    /**
     * I perform some client-side validations on an URI input field
     * @method checkResourceInput
     * @param {String} uriValue
     * @param {String} nameValue
     * @param {String} thumbValue
     * @return
     */
    function checkResourceInput(uriValue, nameValue, thumbValue) {

        if ( uriValue.length > 3 ) {

            var newResource = null;

            var checkers = [
                function (src, name) {
                    // Wikipedia
                    var thumbSrc = (thumbValue) ? thumbValue : null;
                    var res = /wikipedia\.org\/wiki\//.exec(src);

                    if (res !== null) {
                        return createResource(src, "wikipedia", name, thumbSrc);
                    }
                    return null;
                },
                function (src, name) {
                    // Youtube
                    // Check various patterns
                    var yt_list = [ /youtube\.com\/watch\?v=([^\&\?\/]+)/,
                                    /youtube\.com\/embed\/([^\&\?\/]+)/,
                                    /youtube\.com\/v\/([^\&\?\/]+)/,
                                    /youtu\.be\/([^\&\?\/]+)/ ];
                    for (var i in yt_list) {
                        var res = yt_list[i].exec(src);
                        if (res !== null) {
                            var timeCode = /t=([0-9]*)/.exec(src),
                                tcString = (timeCode) ? '?start=' + timeCode[1] : '';
                            return createResource("https://www.youtube.com/embed/" + res[1] + tcString,
                                                   "youtube", name, "https://img.youtube.com/vi/" + res[1] + "/2.jpg");
                        }
                    }
                    return null;
                },
                function (src, name) {
                    // Vimeo
                    var res = /^(http\:\/\/|https\:\/\/)?(www\.)?(vimeo\.com\/)([0-9]+)$/.exec(src);
                    if (res !== null) {
                        // Create the resource beforehand, so that we can update its thumb property asynchronously
                        var r = createResource("https://player.vimeo.com/video/" + res[4], "vimeo", name);
                        $.ajax({
                            url: "https://vimeo.com/api/v2/video/" + res[4] + ".json",
                            async: false,
                            success: function (data) {
                                r.thumb = data[0].thumbnail_large;

                                var vimeoID = data[0].id.toString();

                                if (!r.name || r.name == vimeoID) {
                                    r.name = data[0].title;
                                }
                            }
                        });

                        return r;
                    } else {
                        return null;
                    }
                },
                function (src, name) {
                    // OpenStreeMap
                    var res = /www\.openstreetmap\.org.+#map=(\d+)\/([\d.]+)\/([\d.]+)/.exec(src);
                    if (res) {
                        var r = createResource("", "location", name);
                        r.attributes.lat = res[2];
                        r.attributes.lon = res[3];
                        return r;
                    }
                    res = /www\.openstreetmap\.org.+lat=([\d.]+).+lon=([\d.]+)/.exec(src);
                    if (res) {
                        var r = createResource("", "location", name);
                        r.attributes.lat = res[1];
                        r.attributes.lon = res[2];
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Image
                    if (/\.(gif|jpg|jpeg|png)$/i.exec(src)) {
                        return createResource(src, "image", name, src);
                    } else {
                        // We should do a HEAD request and check the
                        // content-type but it is not possible to do sync
                        // cross-domain requests, so we should return a
                        // Future value.
                        return null;
                    }
                    return null;
                },
                function (src, name) {
                    // Video
                    if (/\.(mp4|m3u8)$/i.exec(src)) {
                        return createResource(src, "video", name);
                    } else {
                        // We should do a HEAD request and check the
                        // content-type but it is not possible to do sync
                        // cross-domain requests, so we should return a
                        // Future value.
                        return null;
                    }
                    return null;
                },
                function (src, name) {
                    // Audio
                    var thumbSrc = (thumbValue) ? thumbValue : null;
                    if (/\.(mp3)$/i.exec(src)) {
                        return createResource(src, "audio", name, thumbSrc);
                    } else {
                        // We should do a HEAD request and check the
                        // content-type but it is not possible to do sync
                        // cross-domain requests, so we should return a
                        // Future value.
                        return null;
                    }
                    return null;
                },
                function (src, name) {
                    // PDF
                    var thumbSrc = (thumbValue) ? thumbValue : null;
                    if (/\.(pdf)/i.exec(src)) {
                        return createResource(src, "pdf", name, thumbSrc);
                    } else {
                        // We should do a HEAD request and check the
                        // content-type but it is not possible to do sync
                        // cross-domain requests, so we should return a
                        // Future value.
                        return null;
                    }
                    return null;
                },
                function (src, name) {
                    // Wistia
                    var res = /(?:fast\.)?wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/.exec(src);
                    if (!res) res = /wi\.st\/medias\/([a-zA-Z0-9]+)/.exec(src);
                    if (res !== null) {
                        return createResource("https://fast.wistia.net/embed/iframe/" + res[1], "wistia", name);
                    }
                    return null;
                },
                function (src, name) {
                    // SoundCloud
                    var thumbSrc = (thumbValue) ? thumbValue : null;
                    if (/soundcloud\.com\/[\w-]+\/[\w-]+/.exec(src)) {
                        return createResource("https://w.soundcloud.com/player/?url=" + encodeURIComponent(src) + "&auto_play=false&show_artwork=true", "soundcloud", name, thumbSrc);
                    }
                    return null;
                },
                function (src, name) {
                    // Twitch
                    var res = /twitch\.tv\/videos\/(\d+)/.exec(src);
                    if (res !== null) {
                        return createResource("https://player.twitch.tv/?video=" + res[1] + "&parent=" + window.location.hostname, "twitch", name);
                    }
                    res = /twitch\.tv\/([\w]+)$/.exec(src);
                    if (res !== null) {
                        return createResource("https://player.twitch.tv/?channel=" + res[1] + "&parent=" + window.location.hostname, "twitch", name);
                    }
                    return null;
                },
                function (src, name) {
                    // Bluesky
                    var res = /bsky\.app\/profile\/([\w.:-]+)\/post\/([\w]+)/.exec(src);
                    if (res !== null) {
                        var fullUrl = "https://bsky.app/profile/" + res[1] + "/post/" + res[2];
                        var r = createResource(fullUrl, "bluesky", name);
                        $.ajax({
                            url: "_server/ajaxServer.php",
                            data: { a: "oembedProxy", url: "https://embed.bsky.app/oembed?url=" + encodeURIComponent(fullUrl) },
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) {
                                    r.attributes.html = data.html;
                                }
                                if (data.author_name && (!r.name || r.name.length < 3)) {
                                    r.name = data.author_name + "'s post";
                                }
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // CodePen
                    var res = /codepen\.io\/([\w-]+)\/(?:pen|full|details)\/([\w]+)/.exec(src);
                    if (res !== null) {
                        return createResource("https://codepen.io/" + res[1] + "/embed/" + res[2] + "?default-tab=result", "codepen", name);
                    }
                    return null;
                },
                function (src, name) {
                    // Figma
                    if (/figma\.com\/(file|proto|design|board)\//.exec(src)) {
                        return createResource(src, "figma", name);
                    }
                    return null;
                },
                function (src, name) {
                    // Loom
                    var res = /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(src);
                    if (res !== null) {
                        return createResource("https://www.loom.com/embed/" + res[1], "loom", name);
                    }
                    return null;
                },
                function (src, name) {
                    // X/Twitter
                    var res = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "xtwitter", name);
                        $.ajax({
                            url: "https://publish.twitter.com/oembed?url=" + encodeURIComponent(src) + "&omit_script=true",
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) r.attributes.html = data.html;
                                if (data.author_name && (!r.name || r.name.length < 3)) r.name = data.author_name + "'s post";
                            },
                            error: function() {
                                r.type = 'urlpreview';
                                r.attributes.originalType = 'xtwitter';
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // TikTok
                    var res = /tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "tiktok", name);
                        $.ajax({
                            url: "https://www.tiktok.com/oembed?url=" + encodeURIComponent(src),
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) r.attributes.html = data.html;
                                if (data.thumbnail_url) r.thumb = data.thumbnail_url;
                                if (data.title && (!r.name || r.name.length < 3)) r.name = data.title;
                            },
                            error: function() {
                                r.type = 'urlpreview';
                                r.attributes.originalType = 'tiktok';
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Mastodon (/@user/id or /users/user/statuses/id pattern)
                    // For cross-instance URLs (username contains @), resolve the canonical
                    // home-instance URL via the public Mastodon API (CORS: allow *).
                    var res = /^https?:\/\/([^\/]+)\/@([a-zA-Z0-9_.@]+)\/(\d+)/.exec(src);
                    if (!res) res = /^https?:\/\/([^\/]+)\/users\/([a-zA-Z0-9_.@]+)\/statuses\/(\d+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "mastodon", name);
                        r.attributes.instance = res[1];
                        // Cross-instance: username contains a second @
                        if (res[2].indexOf('@') !== -1) {
                            var apiUrl = 'https://' + res[1] + '/api/v1/statuses/' + res[3];
                            $.ajax({
                                url: apiUrl,
                                async: false,
                                timeout: 5000,
                                success: function(data) {
                                    if (data.url) {
                                        r.attributes.embedUrl = data.url + '/embed';
                                    }
                                }
                            });
                        }
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Spotify
                    var res = /open\.spotify\.com\/(track|album|playlist|show|episode)\/([a-zA-Z0-9]+)/.exec(src);
                    if (res !== null) {
                        var thumbSrc = (thumbValue) ? thumbValue : null;
                        var r = createResource(src, "spotify", name, thumbSrc);
                        r.attributes.contentType = res[1];
                        r.attributes.contentId = res[2];
                        $.ajax({
                            url: "https://open.spotify.com/oembed?url=" + encodeURIComponent(src),
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) r.attributes.html = data.html;
                                if (data.thumbnail_url) r.thumb = data.thumbnail_url;
                                if (data.title && (!r.name || r.name.length < 3)) r.name = data.title;
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // SlideShare
                    var res = /slideshare\.net\/([^\/]+)\/([^\/\?]+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "slideshare", name);
                        $.ajax({
                            url: "https://www.slideshare.net/api/oembed/2?url=" + encodeURIComponent(src) + "&format=json",
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) r.attributes.html = data.html;
                                if (data.thumbnail) r.thumb = data.thumbnail;
                                if (data.title && (!r.name || r.name.length < 3)) r.name = data.title;
                            },
                            error: function() {
                                r.type = 'urlpreview';
                                r.attributes.originalType = 'slideshare';
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Reddit
                    var res = /reddit\.com\/r\/([^\/]+)\/comments\/([a-zA-Z0-9]+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "reddit", name);
                        $.ajax({
                            url: "https://www.reddit.com/oembed?url=" + encodeURIComponent(src),
                            async: false,
                            timeout: 5000,
                            success: function(data) {
                                if (data.html) r.attributes.html = data.html;
                                if (data.author_name && (!r.name || r.name.length < 3)) r.name = data.author_name + "'s post";
                            },
                            error: function() {
                                r.type = 'urlpreview';
                                r.attributes.originalType = 'reddit';
                            }
                        });
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Flickr
                    var flickr_patterns = [
                        /flickr\.com\/photos\/([^\/]+)\/(\d+)/,
                        /flickr\.com\/photos\/([^\/]+)\/albums\/(\d+)/,
                        /flickr\.com\/photos\/([^\/]+)\/galleries\/(\d+)/
                    ];
                    for (var i in flickr_patterns) {
                        var res = flickr_patterns[i].exec(src);
                        if (res !== null) {
                            var r = createResource(src, "flickr", name);
                            $.ajax({
                                url: "https://www.flickr.com/services/oembed/?url=" + encodeURIComponent(src) + "&format=json",
                                async: false,
                                timeout: 5000,
                                success: function(data) {
                                    if (data.type === 'photo') {
                                        r.thumb = data.url;
                                        r.attributes.photoUrl = data.url;
                                    } else if (data.html) {
                                        r.attributes.html = data.html;
                                    }
                                    if (data.title && (!r.name || r.name.length < 3)) r.name = data.title;
                                },
                                error: function() {
                                    r.type = 'urlpreview';
                                    r.attributes.originalType = 'flickr';
                                }
                            });
                            return r;
                        }
                    }
                    return null;
                },
                function (src, name) {
                    // Instagram (always URL preview - no open embedding)
                    var res = /instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/.exec(src);
                    if (res !== null) {
                        var r = createResource(src, "urlpreview", name);
                        r.attributes.originalType = 'instagram';
                        return r;
                    }
                    return null;
                },
                function (src, name) {
                    // Facebook (always URL preview - no open embedding)
                    var fb_patterns = [
                        /facebook\.com\/([^\/]+)\/posts\/([a-zA-Z0-9]+)/,
                        /facebook\.com\/([^\/]+)\/videos\/([a-zA-Z0-9]+)/,
                        /facebook\.com\/watch\/\?v=(\d+)/,
                        /fb\.watch\/([a-zA-Z0-9_-]+)/
                    ];
                    for (var i in fb_patterns) {
                        var res = fb_patterns[i].exec(src);
                        if (res !== null) {
                            var r = createResource(src, "urlpreview", name);
                            r.attributes.originalType = 'facebook';
                            return r;
                        }
                    }
                    return null;
                },
                function (src, name) {
                    // Default fallback, will work for any URL
                    var thumbSrc = (thumbValue) ? thumbValue : null;
                    if (/(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])/.exec(src)) {
                        var r = createResource(src, "webpage", name, thumbSrc);
                            //r.thumb = "http://immediatenet.com/t/l3?Size=1024x768&URL="+src;
                        return r;
                    }
                    return null;
                }
            ];

            for (var i in checkers) {
                newResource = checkers[i](uriValue, nameValue);
                if (newResource !== null) {
                    $('.resourceInputMessage').attr('class', 'resourceInputMessage message active success').text(labels['MessageURLValid'] +': '+ newResource.type);
                    renderWebsitePreview(uriValue, newResource.type, newResource);
                    return newResource;
                    break;
                } else {
                    $('.resourceInputMessage').attr('class', 'resourceInputMessage message active error').text(labels['MessageURLNotValid']);
                }
            }

        } else {
            // uri value length <= 3
        }

    }




    /**
     * I render a preview of a resource
     * @method renderWebsitePreview
     * @param {String} uriValue
     * @param {String} resourceType
     * @param {Object} resourceObj (optional)
     * @return
     */
    function renderWebsitePreview(uriValue, resourceType, resourceObj) {

        $('#resourceInputTabURL .resourceURLPreview').empty();
        $('.resourceInput[name="thumbnail"]').val('');
        $('.resourceInput[name="embed"]').val('');
        $('.uploadForm .corsWarning').removeClass('active');

        $('#resourceInputTabURL .resourceURLPreview').append('<div class="workingSpinner dark"></div>');

        if ( uriValue.length > 3 ) {

            if (previewXHR) { previewXHR.abort(); }

            if ((resourceType == 'webpage' || resourceType == 'wikipedia') && FrameTrail.getState('storageMode') !== 'local') {
                previewXHR = $.ajax({
                    type:   'POST',
                    url:    '_server/ajaxServer.php',
                    cache:  false,
                    data: {
                        a:          'fileGetUrlInfo',
                        url: uriValue
                    }
                }).done(function(data) {

                    //console.log(data);
                    if (data.code == 0) {
                        if (data.urlInfo.image == 'https://en.wikipedia.org/static/apple-touch/wikipedia.png') {
                            data.urlInfo.image = null;
                        }
                        if (!data.urlInfo.title) {
                            data.urlInfo.title = '';
                        }
                        if (!data.urlInfo.description) {
                            data.urlInfo.description = '';
                        }
                        renderResourcePreviewElement(resourceType, data.urlInfo.title, data.urlInfo.image, data.urlInfo.description, data.embed);
                    } else if (data.code == 1) {
                        console.log(data.string);
                    }

                });
            } else {
                renderResourcePreviewElement(resourceType, resourceObj.name, resourceObj.description, resourceObj.thumb);
            }
            

        } else {
            // uri value length <= 3
        }

    }

    /**
     * I render the actual preview element
     * @method renderResourcePreviewElement
     * @param {String} resourceType
     * @param {String} resourceTitle
     * @param {String} resourceThumb
     * @param {String} resourceDescription
     * @param {String} embed (optional)
     * @return
     */
    function renderResourcePreviewElement(resourceType, resourceTitle, resourceThumb, resourceDescription, embed) {
        $('.resourceInput[name="thumbnail"]').val(resourceThumb);
        $('.resourceInput[name="embed"]').val(embed);

        if ($('.resourceNameInput').val().length < 3 && 
            resourceTitle != 'YouTube') {
            $('.resourceNameInput').val(resourceTitle);
            $('.resourceNameInput').trigger('change');
        }
        
        var previewTitle = ($('.resourceNameInput').val().length > 3) ? $('.resourceNameInput').val() : resourceTitle;
        var previewImageString = (resourceThumb) ? 'background-image:url('+ resourceThumb +')' : '';
        
        var previewElem = $('<div class="resourceThumb" data-type="'+ resourceType +'" style="'+ previewImageString +'">'
                           +'    <div class="resourceOverlay">'
                           +'    </div>'
                           +'    <div class="resourceTitle">'+ previewTitle +'</div>'
                           +'</div>');
        
        $('#resourceInputTabURL .resourceURLPreview .resourceThumb').remove();
        $('#resourceInputTabURL .resourceURLPreview').append(previewElem);

        if (embed && embed == 'forbidden') {
            $('.uploadForm .corsWarning').addClass('active');
        } else {
            $('.uploadForm .corsWarning').removeClass('active');
        }

        $('#resourceInputTabURL .resourceURLPreview .workingSpinner').remove();
    }


    /**
     * PLEASE DOCUMENT THIS.
     *
     *
     * @method createResource
     * @param {} src
     * @param {} type
     * @param {} name
     * @param {} thumb
     * @return r
     */
    function createResource(src, type, name, thumb) {
        var r = {};
        r.src = src;
        r.type = type;
        r.name = name;
        if (! r.name) {
            // Use the url basename.
            r.name = src.replace(/^(\w+:)?\/\/([^\/]+\/?).*$/,'$2').replace(/www./g, "").replace(/_/g, " ").replace(/-/g, " ").replace(/\//g, "");
        }
        r.thumb = thumb;
        r.attributes = {};
        if ($('.resourceInput[name="embed"]').val() == 'forbidden') {
            r.attributes['embed'] = 'forbidden';
        }
        return r;
    }



	/**
	 * I delete a resource from the server.
	 *
	 * @method deleteResource
	 * @param {String} resourceID
	 * @param {Function} successCallback
	 * @param {Function} cancelCallback
	 */
	function deleteResource(resourceID, successCallback, cancelCallback) {

		if (FrameTrail.getState('storageMode') === 'local') {
			var adapter = FrameTrail.module('StorageManager').getAdapter();
			adapter.readJSON('resources/_index.json').then(function(indexData) {
				if (!indexData.resources[resourceID]) {
					cancelCallback({ code: 3, string: 'Resource not found' });
					return;
				}
				var res = indexData.resources[resourceID];
				var deleteTasks = [];

				// Delete the source file if it's a local file (not an external URL)
				if (res.src && !/^(https?:|\/\/|file:|blob:)/.test(res.src)) {
					deleteTasks.push(adapter.deleteFile('resources/' + res.src).catch(function() {}));
				}
				// Delete the thumbnail file if it's a local file
				if (res.thumb && !/^(https?:|\/\/|file:|blob:)/.test(res.thumb)) {
					deleteTasks.push(adapter.deleteFile('resources/' + res.thumb).catch(function() {}));
				}

				delete indexData.resources[resourceID];
				deleteTasks.push(adapter.writeJSON('resources/_index.json', indexData));
				return Promise.all(deleteTasks);
			}).then(function() {
				successCallback();
			}).catch(function(err) {
				cancelCallback({ code: 1, string: err.message });
			});
			return;
		}

		$.ajax({
			type:   'POST',
			url:    '_server/ajaxServer.php',
			cache:  false,
			data: {
				a: 			'fileDelete',
				resourcesID: resourceID
			}
		}).done(function(data) {

			if (data.code === 0) {
				successCallback();
			} else {
				cancelCallback(data);
			}

		});

	};




	/**
	 * I render a list of thumbnails for either all resource items,
	 * or a narrowed down set of them.
	 *
	 * The targetElement should be a &lt;div&gt; or likewise, and will afterwards contain
	 * the elements which were rendered from e.g. {{#crossLink "ResourceImage/renderThumb:method"}}ResourceImage/renderThumb{{/crossLink}}
	 *
	 * If filter is true, then the method will ask the server only for a list of resources which meet the key-condition-value requirements (e.g. "type" "==" "video"). See also server docs!
	 *
	 * @method renderList
	 * @param {HTMLElement} targetElement
	 * @param {Boolean} filter
	 * @param {String} key
	 * @param {String} condition
	 * @param {String} value
	 */
	function renderList(targetElement, filter, key, condition, value) {

		targetElement.empty();
		targetElement.append('<div class="loadingScreen"><div class="workingSpinner dark"></div></div>');


		if (filter) {

			getFilteredList(targetElement, key, condition, value)

		} else {

			getCompleteList(targetElement)

		}


	};




	/**
	 * I call the .renderThumb method for all Resource data objects in the array
	 * (e.g. {{#crossLink "ResourceImage/renderThumb:method"}}ResourceImage/renderThumb{{/crossLink}})
	 * and append the returned element to targetElement.
	 *
	 * @method renderResult
	 * @param {HTMLElement} targetElement
	 * @param {Array} array
	 * @private
	 */
	function renderResult(targetElement, array) {

		for (var id in array) {

			var resourceThumb = FrameTrail.newObject(
				(	'Resource'
				  + array[id].type.charAt(0).toUpperCase()
				  + array[id].type.slice(1)),
				array[id]
			).renderThumb(id);

            //add thumb to target element
			targetElement.append(resourceThumb);

		}

	};



    /**
	 * I am the method choosen, when {{#crossLink "ResourceManager/renderList:method"}}ResourceManager/renderList{{/crossLink}} is called
	 * with filter set to false.
	 *
	 * I update the {{#crossLink "Database/resources:attribute"}}resource database{{/crossLink}} and the render the result into the targetElement
	 *
	 * @method getCompleteList
	 * @param {HTMLElement} targetElement
	 * @private
	 */
	function getCompleteList(targetElement) {

		var database = FrameTrail.module('Database');

		database.loadResourceData(

			function(){

	    		renderResult(targetElement, database.resources);

				targetElement.find('.loadingScreen').fadeOut(600, function() {
                    $(this).remove();
                });

			},

			function(errorMessage){

				targetElement.find('.loadingScreen').remove();
				targetElement.append('<div class="loadingErrorMessage"><div class="message error active">' + errorMessage + '</div></div>');

			}

		);

	}



	/**
	 * I am the method choosen, when {{#crossLink "ResourceManager/renderList:method"}}ResourceManager/renderList{{/crossLink}} is called
	 * with filter set to true.
	 *
	 * The server will be asked to return a list of resources, which meet the requierements specified with key, considition, value
	 * (e.g. "type" "==" "video" ). See the server docs for more details!
	 *
	 * @method getFilteredList
	 * @param {HTMLElement} targetElement
	 * @param {String} key
	 * @param {String} condition
	 * @param {Array} values
	 * @private
	 */
	function getFilteredList(targetElement, key, condition, values) {

		if (FrameTrail.getState('storageMode') === 'local') {
			// Client-side filtering using the already-loaded Database resources
			var allResources = FrameTrail.module('Database').resources;
			var result = {};
			if (typeof values === 'string') { values = [values]; }
			for (var k in allResources) {
				if (!allResources.hasOwnProperty(k)) continue;
				var v = allResources[k];
				var match = false;
				if (condition === '==' || condition === 'contains') match = (values.indexOf(v[key]) !== -1);
				else if (condition === '!=') match = (values.indexOf(v[key]) === -1);
				else if (condition === '<=') match = (v[key] <= values[0]);
				else if (condition === '>=') match = (v[key] >= values[0]);
				if (match) result[k] = v;
			}
			renderResult(targetElement, result);
			targetElement.find('.loadingScreen').fadeOut(600, function() { $(this).remove(); });
			return;
		}

		$.ajax({

            type:   'POST',
            url:    '_server/ajaxServer.php',
            cache:  false,

            data: {
            	a: 			'fileGetByFilter',
            	key: 		key,
            	condition: 	condition,
            	values: 	values
            }

        }).done(function(data){

        	if (data.code === 0) {

        		renderResult(targetElement, data.result)

        	}

			targetElement.find('.loadingScreen').fadeOut(600, function() {
                $(this).remove();
            });


		}).fail(function(errorMessage){

			targetElement.find('.loadingScreen').remove();
			targetElement.append('<div class="loadingErrorMessage"><div class="message error active">' + errorMessage + '</div></div>');

		});

	}




	/**
	 * I render into the targetElement, which should be a &lt;div&gt; or likewise, a set of thumbnails.
	 * These thumbnails are draggable in the &lt;div class="mainContainer"&gt; to allow drop actions into timelines or into the overlay container.
	 *
	 * @method renderResourcePicker
	 * @param {HTMLElement} targetElement
	 */
	function renderResourcePicker(targetElement) {

		var resourceDatabase 	= FrameTrail.module('Database').resources,
			container		 	= $(	'<div class="resourcePicker">'
									  + '    <div class="resourcePickerControls">'
									  //+ '        <button class="manageResourcesButton">Manage Resources</button>'
                                      + '        <button class="addResourcesButton" data-tooltip-right="'+ labels['ResourceAddNew'] +'"><span class="icon-doc-new"></span></button>'
									  + '    </div>'
									  + '    <div class="resourcePickerList"></div>'
									  + '</div>'),
			resourceList 		= container.find('.resourcePickerList'),
			resourceThumb;

		container.find('.addResourcesButton').click(function() {

            FrameTrail.module('ResourceManager').uploadResource(function(){

                FrameTrail.module('Database').loadResourceData(function() {
                    targetElement.empty();
                    renderResourcePicker(targetElement);
                });

            });

		});

		for (var i in resourceDatabase) {

			resourceThumb = FrameTrail.newObject(
				(	'Resource'
				  + resourceDatabase[i].type.charAt(0).toUpperCase()
				  + resourceDatabase[i].type.slice(1)),
				resourceDatabase[i]
			).renderThumb();



			resourceThumb.draggable({
				containment: 	'.mainContainer',
				helper: 		'clone',
				revert: 		'invalid',
				revertDuration: 100,
				appendTo: 		'body',
				distance: 		10,
				zIndex: 		1000,

				start: function( event, ui ) {
					ui.helper.css({
						top: $(event.currentTarget).offset().top + "px",
						left: $(event.currentTarget).offset().left + "px",
						width: $(event.currentTarget).width() + "px",
						height: $(event.currentTarget).height() + "px"
					});
					$(event.currentTarget).addClass('dragPlaceholder');
				},

				stop: function( event, ui ) {
					$(event.target).removeClass('dragPlaceholder');
				}

			});

			resourceList.append(resourceThumb);

		}


		targetElement.append(container);

	}


	return {

		renderList: 			renderList,
		renderResourcePicker: 	renderResourcePicker,

		updateResourceDatabase: updateResourceDatabase,
		uploadResource: 		uploadResource,
		deleteResource: 		deleteResource

	};


});
