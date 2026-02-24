/**
 * @module Player
 */

/**
 * I am the HypervideoSettingsDialog. I provide a dialog for editing hypervideo-specific settings.
 *
 * @class HypervideoSettingsDialog
 * @static
 */

FrameTrail.defineModule('HypervideoSettingsDialog', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    /**
     * Convert seconds to hours, minutes, seconds object
     * @method secondsToHMS
     * @param {Number} totalSeconds
     * @return {Object} { hours, minutes, seconds }
     */
    function secondsToHMS(totalSeconds) {
        var h = Math.floor(totalSeconds / 3600);
        var m = Math.floor((totalSeconds % 3600) / 60);
        var s = Math.floor(totalSeconds % 60);
        return { hours: h, minutes: m, seconds: s };
    }

    /**
     * Get items that would be out of range if duration is changed
     * @method getOutOfRangeItems
     * @param {Number} newDuration - new duration in seconds
     * @return {Object} { overlays: [], codeSnippets: [], annotations: [], hasAffectedItems: Boolean }
     */
    function getOutOfRangeItems(newDuration) {
        var HypervideoModel = FrameTrail.module('HypervideoModel');
        var outOfRange = { 
            overlays: [], 
            codeSnippets: [], 
            annotations: [],
            hasAffectedItems: false
        };
        
        // Check overlays (start >= newDuration OR end > newDuration)
        if (HypervideoModel.overlays) {
            HypervideoModel.overlays.forEach(function(overlay) {
                if (overlay.data.start >= newDuration) {
                    outOfRange.overlays.push({ item: overlay, action: 'delete' });
                    outOfRange.hasAffectedItems = true;
                } else if (overlay.data.end > newDuration) {
                    outOfRange.overlays.push({ item: overlay, action: 'truncate', newEnd: newDuration });
                    outOfRange.hasAffectedItems = true;
                }
            });
        }
        
        // Check code snippets (only have start time)
        if (HypervideoModel.codeSnippets) {
            HypervideoModel.codeSnippets.forEach(function(snippet) {
                if (snippet.data.start >= newDuration) {
                    outOfRange.codeSnippets.push({ item: snippet, action: 'delete' });
                    outOfRange.hasAffectedItems = true;
                }
            });
        }
        
        // Check annotations (all user annotations)
        if (HypervideoModel.annotations) {
            HypervideoModel.annotations.forEach(function(anno) {
                if (anno.data.start >= newDuration) {
                    outOfRange.annotations.push({ item: anno, action: 'delete' });
                    outOfRange.hasAffectedItems = true;
                } else if (anno.data.end > newDuration) {
                    outOfRange.annotations.push({ item: anno, action: 'truncate', newEnd: newDuration });
                    outOfRange.hasAffectedItems = true;
                }
            });
        }
        
        return outOfRange;
    }

    /**
     * Format time in seconds to MM:SS or HH:MM:SS string
     * @method formatTime
     * @param {Number} seconds
     * @return {String}
     */
    function formatTime(seconds) {
        var hms = secondsToHMS(seconds);
        if (hms.hours > 0) {
            return hms.hours + ':' + String(hms.minutes).padStart(2, '0') + ':' + String(hms.seconds).padStart(2, '0');
        }
        return hms.minutes + ':' + String(hms.seconds).padStart(2, '0');
    }

    /**
     * Apply duration change - delete or truncate out-of-range items
     * @method applyDurationChange
     * @param {Number} newDuration
     * @param {Object} outOfRangeItems
     * @param {Object} DatabaseEntry
     */
    function applyDurationChange(newDuration, outOfRangeItems, DatabaseEntry) {
        var HypervideoModel = FrameTrail.module('HypervideoModel');
        
        // Delete fully out-of-range overlays
        outOfRangeItems.overlays.filter(function(i) { return i.action === 'delete'; }).forEach(function(item) {
            var index = HypervideoModel.overlays.indexOf(item.item);
            if (index > -1) {
                HypervideoModel.overlays.splice(index, 1);
            }
        });
        
        // Truncate partially out-of-range overlays
        outOfRangeItems.overlays.filter(function(i) { return i.action === 'truncate'; }).forEach(function(item) {
            item.item.data.end = item.newEnd;
        });
        
        // Delete out-of-range code snippets
        outOfRangeItems.codeSnippets.filter(function(i) { return i.action === 'delete'; }).forEach(function(item) {
            var index = HypervideoModel.codeSnippets.indexOf(item.item);
            if (index > -1) {
                HypervideoModel.codeSnippets.splice(index, 1);
            }
        });
        
        // Delete fully out-of-range annotations
        outOfRangeItems.annotations.filter(function(i) { return i.action === 'delete'; }).forEach(function(item) {
            var index = HypervideoModel.annotations.indexOf(item.item);
            if (index > -1) {
                HypervideoModel.annotations.splice(index, 1);
            }
        });
        
        // Truncate partially out-of-range annotations
        outOfRangeItems.annotations.filter(function(i) { return i.action === 'truncate'; }).forEach(function(item) {
            item.item.data.end = item.newEnd;
        });
        
        // Update duration in database entry
        if (DatabaseEntry.clips && DatabaseEntry.clips[0]) {
            DatabaseEntry.clips[0].duration = newDuration;
        }
        
        // Update HypervideoModel duration
        HypervideoModel.durationFull = newDuration;
        HypervideoModel.duration = newDuration - HypervideoModel.offsetIn;
    }

    /**
     * Show confirmation dialog for duration change with affected items
     * @method showDurationChangeConfirmation
     * @param {Number} newDuration
     * @param {Object} outOfRangeItems
     * @param {Function} onConfirm - callback when user confirms
     * @param {Function} onCancel - callback when user cancels
     */
    function showDurationChangeConfirmation(newDuration, outOfRangeItems, onConfirm, onCancel) {
        var messageLines = [];
        var formattedTime = formatTime(newDuration);
        
        var overlaysToDelete = outOfRangeItems.overlays.filter(function(i) { return i.action === 'delete'; }).length;
        var overlaysToTruncate = outOfRangeItems.overlays.filter(function(i) { return i.action === 'truncate'; }).length;
        var snippetsToDelete = outOfRangeItems.codeSnippets.filter(function(i) { return i.action === 'delete'; }).length;
        var annotationsToDelete = outOfRangeItems.annotations.filter(function(i) { return i.action === 'delete'; }).length;
        var annotationsToTruncate = outOfRangeItems.annotations.filter(function(i) { return i.action === 'truncate'; }).length;
        
        if (overlaysToDelete > 0) {
            messageLines.push('• ' + overlaysToDelete + ' ' + labels['DurationChangeOverlaysDeleted']);
        }
        if (overlaysToTruncate > 0) {
            messageLines.push('• ' + overlaysToTruncate + ' ' + labels['DurationChangeOverlaysTruncated'] + ' ' + formattedTime);
        }
        if (snippetsToDelete > 0) {
            messageLines.push('• ' + snippetsToDelete + ' ' + labels['DurationChangeCodeSnippetsDeleted']);
        }
        if (annotationsToDelete > 0) {
            messageLines.push('• ' + annotationsToDelete + ' ' + labels['DurationChangeAnnotationsDeleted']);
        }
        if (annotationsToTruncate > 0) {
            messageLines.push('• ' + annotationsToTruncate + ' ' + labels['DurationChangeAnnotationsTruncated'] + ' ' + formattedTime);
        }
        
        var confirmDialog = $('<div class="durationChangeConfirmDialog">'
                            + '    <div class="message active">'+ labels['DurationChangeWarningMessage'] +'</div>'
                            + '    <div class="affectedItems">' + messageLines.join('<br>') + '</div>'
                            + '</div>');

        var confirmDialogCtrl = Dialog({
            title:   labels['DurationChangeWarningTitle'],
            modal:   true,
            width:   450,
            content: confirmDialog,
            close: function() {
                confirmDialogCtrl.destroy();
                if (onCancel) onCancel();
            },
            buttons: [
                { text: labels['GenericApply'],
                    click: function() {
                        confirmDialogCtrl.close();
                        if (onConfirm) onConfirm();
                    }
                },
                { text: labels['GenericCancel'],
                    click: function() {
                        confirmDialogCtrl.close();
                    }
                }
            ]
        });
    }

    /**
     * I open the hypervideo settings dialog for a specific hypervideo.
     * @method open
     * @param {String} hypervideoID
     */
    function open(hypervideoID) {

        var database = FrameTrail.module('Database'),
            hypervideo = database.hypervideos[hypervideoID],
            thisID = hypervideoID;

        if (!hypervideo) {
            console.error('Hypervideo not found:', hypervideoID);
            return;
        }

        var formBuilder = FrameTrail.module('HypervideoFormBuilder');

        // Check if this is a canvas (empty) video - no resourceId means canvas
        var isCanvasVideo = hypervideo.clips && hypervideo.clips[0] && !hypervideo.clips[0].resourceId && !hypervideo.clips[0].src;
        var originalDuration = isCanvasVideo ? (hypervideo.clips[0].duration || 0) : 0;
        var pendingDurationChange = null; // Will hold { newDuration, outOfRangeItems } if duration change needs confirmation
        
        // Video source replacement tracking
        var originalResourceId = hypervideo.clips && hypervideo.clips[0] ? hypervideo.clips[0].resourceId : null;
        var originalSrc = hypervideo.clips && hypervideo.clips[0] ? hypervideo.clips[0].src : null;
        var pendingSourceChange = null; // Will hold { resourceId, src, duration, outOfRangeItems } if source change needs confirmation
        var sourceChangeConfirmed = false;

        var captionsVisible = hypervideo.config && hypervideo.config.captionsVisible && hypervideo.config.captionsVisible.toString() === 'true';

        var EditHypervideoForm = $('<form method="POST" class="editHypervideoForm">'
                                  + formBuilder.generateSettingsRow({
                                        name: hypervideo.name || '',
                                        description: hypervideo.description || '',
                                        hidden: hypervideo.hidden && hypervideo.hidden.toString() === "true",
                                        captionsVisible: captionsVisible,
                                        showExistingSubtitles: true
                                    })
                                  +'    <hr>'
                                  + formBuilder.generateVideoSourceSection({
                                        duration: isCanvasVideo ? originalDuration : 120,  // Use existing duration or 2 minutes default
                                        currentResourceId: originalResourceId || '',
                                        currentSrc: originalSrc || '',
                                        showUploadButton: true,
                                        isEditMode: true
                                    })
                                  +'    <div class="message error"></div>'
                                  +'</form>');
        
        // Helper to get duration from form input
        function getDurationFromForm() {
            if (!isCanvasVideo) return originalDuration;
            return formBuilder.timeStringToSeconds(EditHypervideoForm.find('input[name="duration"]').val());
        }

        // Populate existing subtitles using shared module
        formBuilder.populateExistingSubtitles(EditHypervideoForm, hypervideo.subtitles);

        // Attach subtitle event handlers using shared module
        formBuilder.attachSubtitleHandlers(EditHypervideoForm);

        // Video Source Tabs Initialization
        (function() {
            var tabs = EditHypervideoForm.find('.videoSourceTabs');
            var videoList = EditHypervideoForm.find('.videoResourceList');
            
            // Render video resources list
            FrameTrail.module('ResourceManager').renderList(videoList, true, 'type', 'contains', ['video', 'youtube', 'vimeo']);
            
            // Pre-select current video resource after list is loaded (watch for loading screen removal)
            if (originalResourceId) {
                var checkLoaded = setInterval(function() {
                    if (videoList.find('.loadingScreen').length === 0) {
                        clearInterval(checkLoaded);
                        // Use data-resourceID (capital ID) to match the actual attribute
                        videoList.find('.resourceThumb[data-resourceID="' + originalResourceId + '"]').addClass('selected');
                    }
                }, 100);
            }
            
            // Initialize jQuery UI tabs with appropriate active tab
            tabs.tabs({
                active: isCanvasVideo ? 1 : 0, // Empty Video tab if canvas, Choose Video tab otherwise
                activate: function(event, ui) {
                    // Don't clear selection when switching tabs - preserve current selection
                }
            });
        })();

        // Handle video resource selection
        EditHypervideoForm.on('click', '.videoResourceList .resourceThumb', function() {
            EditHypervideoForm.find('.videoResourceList .resourceThumb').removeClass('selected');
            $(this).addClass('selected');
            
            var resourceId = $(this).data('resourceid');
            var resource = database.resources[resourceId];
            
            EditHypervideoForm.find('input[name="newResourceId"]').val(resourceId);
            EditHypervideoForm.find('input[name="newResourceSrc"]').val(resource ? resource.src : '');
            // Duration will be determined when video loads - for now use 0 as placeholder
            EditHypervideoForm.find('input[name="newResourceDuration"]').val(resource ? (resource.duration || 0) : 0);
        });

        // Helper to get new empty video duration
        function getNewEmptyDuration() {
            return formBuilder.timeStringToSeconds(EditHypervideoForm.find('input[name="duration"]').val());
        }

        // Check if source is being changed
        function isSourceChanging() {
            var tabs = EditHypervideoForm.find('.videoSourceTabs');
            var activeTabIndex = tabs.hasClass('ui-tabs') ? tabs.tabs('option', 'active') : 0;
            
            if (activeTabIndex === 0) { // Choose Video tab
                var newResourceId = EditHypervideoForm.find('input[name="newResourceId"]').val();
                // Source is changing if a different resource is selected
                return newResourceId && newResourceId != originalResourceId;
            } else if (activeTabIndex === 1) { // Empty Video tab
                // Converting to empty video - changing if currently NOT canvas, or duration changed
                if (!isCanvasVideo) return true; // Changing from video to empty
                return getNewEmptyDuration() !== originalDuration;
            }
            return false;
        }

        // Get the new source info
        function getNewSourceInfo() {
            var tabs = EditHypervideoForm.find('.videoSourceTabs');
            var activeTabIndex = tabs.hasClass('ui-tabs') ? tabs.tabs('option', 'active') : 0;
            
            if (activeTabIndex === 0) { // Choose Video tab
                var newResourceId = EditHypervideoForm.find('input[name="newResourceId"]').val();
                var resource = database.resources[newResourceId];
                return {
                    type: 'video',
                    resourceId: newResourceId,
                    src: resource ? resource.src : '',
                    duration: resource ? (resource.duration || 0) : 0,
                    thumb: resource ? resource.thumb : null
                };
            } else { // Empty Video tab
                return {
                    type: 'empty',
                    resourceId: null,
                    src: null,
                    duration: getNewEmptyDuration(),
                    thumb: null
                };
            }
        }

        function updateDatabaseFromForm() {
            // Only called when saving - apply changes to database
            var DatabaseEntry = FrameTrail.module('Database').hypervideos[thisID];

            DatabaseEntry.name = EditHypervideoForm.find('input[name="name"]').val();
            DatabaseEntry.description = EditHypervideoForm.find('textarea[name="description"]').val();
            DatabaseEntry.hidden = EditHypervideoForm.find('input[name="hidden"]').is(':checked');
            
            if (DatabaseEntry.config) {
                for (var configKey in DatabaseEntry.config) {
                    if (configKey === 'layoutArea' || configKey === 'theme') { continue; }
                    var newConfigVal = EditHypervideoForm.find('input[data-configkey=' + configKey + ']').val();
                    newConfigVal = (newConfigVal === 'true')
                                    ? true
                                    : (newConfigVal === 'false')
                                        ? false
                                        : (newConfigVal === undefined)
                                            ? DatabaseEntry.config[configKey]
                                            : newConfigVal;
                    DatabaseEntry.config[configKey] = newConfigVal;
                }
            }

            // Handle video source change
            if (pendingSourceChange) {
                // Apply out-of-range item changes
                if (pendingSourceChange.outOfRangeItems && pendingSourceChange.outOfRangeItems.hasAffectedItems) {
                    applyDurationChange(pendingSourceChange.duration, pendingSourceChange.outOfRangeItems, DatabaseEntry);
                }
                
                // Update source in clips
                if (DatabaseEntry.clips && DatabaseEntry.clips[0]) {
                    DatabaseEntry.clips[0].resourceId = pendingSourceChange.resourceId;
                    DatabaseEntry.clips[0].src = pendingSourceChange.src;
                    DatabaseEntry.clips[0].duration = pendingSourceChange.duration;
                }
                
                // Update thumbnail to match new video source
                DatabaseEntry.thumb = pendingSourceChange.thumb;
                
                // Update HypervideoModel if this is the current hypervideo
                if (thisID == FrameTrail.module('RouteNavigation').hypervideoID) {
                    var HypervideoModel = FrameTrail.module('HypervideoModel');
                    HypervideoModel.durationFull = pendingSourceChange.duration;
                    HypervideoModel.duration = pendingSourceChange.duration - HypervideoModel.offsetIn;
                }
                
                pendingSourceChange = null;
            }
            // Handle duration change for canvas videos (when not changing source)
            else if (isCanvasVideo && pendingDurationChange) {
                applyDurationChange(pendingDurationChange.newDuration, pendingDurationChange.outOfRangeItems, DatabaseEntry);
                pendingDurationChange = null;
            } else if (isCanvasVideo) {
                // No affected items, just update duration directly
                var newDuration = getDurationFromForm();
                if (DatabaseEntry.clips && DatabaseEntry.clips[0]) {
                    DatabaseEntry.clips[0].duration = newDuration;
                }
                // Update HypervideoModel if this is the current hypervideo
                if (thisID == FrameTrail.module('RouteNavigation').hypervideoID) {
                    var HypervideoModel = FrameTrail.module('HypervideoModel');
                    HypervideoModel.durationFull = newDuration;
                    HypervideoModel.duration = newDuration - HypervideoModel.offsetIn;
                }
            }

            if (!DatabaseEntry.subtitles) {
                DatabaseEntry.subtitles = [];
            }
            DatabaseEntry.subtitles.splice(0, DatabaseEntry.subtitles.length);

            EditHypervideoForm.find('.existingSubtitlesItem').each(function () {
                var lang = $(this).find('.subtitlesDelete').attr('data-lang');
                if (lang) {
                    DatabaseEntry.subtitles.push({
                        "src": lang +".vtt",
                        "srclang": lang
                    });
                }
            });

            EditHypervideoForm.find('.newSubtitlesContainer').find('input[type=file]').each(function () {
                var match = /subtitles\[(.+)\]/g.exec($(this).attr('name'));
                if (match) {
                    DatabaseEntry.subtitles.push({
                        "src": match[1] +".vtt",
                        "srclang": match[1]
                    });
                }
            });
        }

        var hypervideoDialogCtrl;

        function completeUpdate() {
            var sourceWasChanged = sourceChangeConfirmed;
            var newSourcePath = null;
            if (sourceWasChanged) {
                var newSourceInfo = getNewSourceInfo();
                newSourcePath = newSourceInfo.src;
            }

            FrameTrail.module('Database').loadHypervideoData(
                function(){
                    if (thisID == FrameTrail.module('RouteNavigation').hypervideoID) {
                        FrameTrail.module('Database').hypervideo = FrameTrail.module('Database').hypervideos[thisID];

                        var name = EditHypervideoForm.find('input[name="name"]').val(),
                            description = EditHypervideoForm.find('textarea[name="description"]').val();

                        FrameTrail.module('HypervideoModel').hypervideoName = name;
                        FrameTrail.module('HypervideoModel').description = description;

                        FrameTrail.module('HypervideoController').updateDescriptions();

                        // re-init subtitles
                        FrameTrail.module('Database').loadSubtitleData(
                            function() {
                                FrameTrail.module('ViewOverview').refreshList();

                                FrameTrail.module('HypervideoModel').subtitleFiles = FrameTrail.module('Database').hypervideo.subtitles;
                                FrameTrail.module('HypervideoModel').initModelOfSubtitles(FrameTrail.module('Database'));
                                FrameTrail.module('SubtitlesController').initController();
                                FrameTrail.changeState('hv_config_captionsVisible', false);

                                // Refresh timeline if duration or source changed
                                if (isCanvasVideo || sourceWasChanged) {
                                    FrameTrail.module('OverlaysController').initController();
                                    FrameTrail.module('CodeSnippetsController').initController();
                                    FrameTrail.module('AnnotationsController').initController();
                                }

                                // If source was changed, reload the hypervideo to get new video
                                if (sourceWasChanged) {
                                    FrameTrail.module('HypervideoModel').updateHypervideo(thisID, FrameTrail.getState('editMode'), true);
                                }

                                hypervideoDialogCtrl.close();
                            },
                            function() {}
                        );

                        FrameTrail.changeState('viewSize', FrameTrail.getState('viewSize'));
                    } else {
                        FrameTrail.module('ViewOverview').refreshList();
                        hypervideoDialogCtrl.close();
                    }
                },
                function(){
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorUpdatingHypervideoData']);
                }
            );
        }

        EditHypervideoForm.on('submit', function(e) {
            e.preventDefault();
            var form = this;

            // Clear error messages
            EditHypervideoForm.find('.message.error').removeClass('active').html('');

            // Check for video source change
            if (isSourceChanging() && !sourceChangeConfirmed) {
                var newSourceInfo = getNewSourceInfo();

                // Validate empty video duration
                if (newSourceInfo.type === 'empty' && newSourceInfo.duration < 4) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
                    return;
                }

                // Get current duration for comparison
                var currentDuration = isCanvasVideo ? originalDuration : (FrameTrail.module('HypervideoModel').durationFull || 0);

                // Check if new duration is shorter and would affect items
                if (newSourceInfo.duration > 0 && newSourceInfo.duration < currentDuration) {
                    var outOfRangeItems = getOutOfRangeItems(newSourceInfo.duration);

                    if (outOfRangeItems.hasAffectedItems) {
                        showDurationChangeConfirmation(newSourceInfo.duration, outOfRangeItems, function() {
                            pendingSourceChange = {
                                resourceId: newSourceInfo.resourceId,
                                src: newSourceInfo.src,
                                duration: newSourceInfo.duration,
                                thumb: newSourceInfo.thumb,
                                outOfRangeItems: outOfRangeItems
                            };
                            sourceChangeConfirmed = true;
                            EditHypervideoForm.submit();
                        }, function() {
                            EditHypervideoForm.find('.videoResourceList .resourceThumb').removeClass('selected');
                            if (originalResourceId) {
                                EditHypervideoForm.find('.videoResourceList .resourceThumb[data-resourceID="' + originalResourceId + '"]').addClass('selected');
                                EditHypervideoForm.find('input[name="newResourceId"]').val(originalResourceId);
                            } else {
                                EditHypervideoForm.find('input[name="newResourceId"]').val('');
                            }
                            var tabs = EditHypervideoForm.find('.videoSourceTabs');
                            tabs.tabs('option', 'active', isCanvasVideo ? 1 : 0);
                        });
                        return;
                    }
                }

                // No affected items or new video is longer - proceed with source change
                pendingSourceChange = {
                    resourceId: newSourceInfo.resourceId,
                    src: newSourceInfo.src,
                    duration: newSourceInfo.duration,
                    thumb: newSourceInfo.thumb,
                    outOfRangeItems: null
                };
                sourceChangeConfirmed = true;
            }

            // Duration validation for canvas videos (when not changing source)
            if (isCanvasVideo && !pendingSourceChange) {
                var newDuration = getDurationFromForm();

                if (newDuration < 4) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
                    return;
                }

                if (newDuration < originalDuration) {
                    var outOfRangeItems = getOutOfRangeItems(newDuration);

                    if (outOfRangeItems.hasAffectedItems && !pendingDurationChange) {
                        showDurationChangeConfirmation(newDuration, outOfRangeItems, function() {
                            pendingDurationChange = { newDuration: newDuration, outOfRangeItems: outOfRangeItems };
                            EditHypervideoForm.submit();
                        }, function() {
                            EditHypervideoForm.find('input[name="duration"]').val(formBuilder.secondsToTimeString(originalDuration));
                        });
                        return;
                    }
                }
            }

            // Subtitles Validation
            var err = 0;
            EditHypervideoForm.find('.subtitlesItem').each(function() {
                $(this).css({'outline': ''});

                if (($(this).find('input[type="file"]:first').attr('name') == 'subtitles[]') || ($(this).find('.subtitlesTmpKeySetter').first().val() == '')
                        || ($(this).find('input[type="file"]:first').val().length == 0)) {
                    $(this).css({'outline': '1px solid #cd0a0a'});
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesEmptyFields']);
                    err++;
                } else if ( !(new RegExp('(' + ['.vtt'].join('|').replace(/\./g, '\\.') + ')$')).test($(this).find('input[type="file"]:first').val()) ) {
                    $(this).css({'outline': '1px solid #cd0a0a'});
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesWrongFormat']);
                    err++;
                }

                if (EditHypervideoForm.find('.subtitlesItem input[type="file"][name="subtitles['+ $(this).find('.subtitlesTmpKeySetter:first').val() +']"]').length > 1
                        || (EditHypervideoForm.find('.existingSubtitlesItem .subtitlesDelete[data-lang="'+ $(this).find('.subtitlesTmpKeySetter:first').val() +'"]').length > 0 ) ) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesLanguageDuplicate']);
                    return false;
                }
            });
            if (err > 0) return;

            // All validation passed - save
            updateDatabaseFromForm();
            var formData = new FormData(form);
            formData.set('a', 'hypervideoChange');
            formData.set('hypervideoID', thisID);
            formData.set('src', JSON.stringify(FrameTrail.module("Database").convertToDatabaseFormat(thisID), null, 4));

            fetch('_server/ajaxServer.php', { method: 'POST', body: formData })
            .then(function(r) { return r.json(); })
            .then(function(response) {
                switch(response['code']) {
                    case 0:
                        var sourceWasChanged = sourceChangeConfirmed;
                        var newSourcePath = null;
                        if (sourceWasChanged) {
                            var newSourceInfo = getNewSourceInfo();
                            newSourcePath = newSourceInfo.src;
                        }

                        if (sourceWasChanged && newSourcePath !== null) {
                            fetch('_server/ajaxServer.php', {
                                method: 'POST',
                                body: new URLSearchParams({ a: 'updateAnnotationSources', hypervideoID: thisID, newSourcePath: newSourcePath })
                            })
                            .then(function() { completeUpdate(); })
                            .catch(function() { completeUpdate(); });
                        } else {
                            completeUpdate();
                        }
                        break;
                    default:
                        EditHypervideoForm.find('.message.error').addClass('active').html('Error: '+ response['string']);
                        break;
                }
            });
        });

        /**
         * Save hypervideo settings locally via File System Access API.
         * Mirrors the ajaxForm submit + success handler logic.
         */
        function saveHypervideoLocally() {
            // Run the same beforeSerialize validation by triggering a fake submit check
            EditHypervideoForm.find('.message.error').removeClass('active').html('');

            // Video source change validation
            if (isSourceChanging() && !sourceChangeConfirmed) {
                var newSourceInfo = getNewSourceInfo();

                if (newSourceInfo.type === 'empty' && newSourceInfo.duration < 4) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
                    return;
                }

                var currentDuration = isCanvasVideo ? originalDuration : (FrameTrail.module('HypervideoModel').durationFull || 0);

                if (newSourceInfo.duration > 0 && newSourceInfo.duration < currentDuration) {
                    var outOfRangeItems = getOutOfRangeItems(newSourceInfo.duration);
                    if (outOfRangeItems.hasAffectedItems) {
                        showDurationChangeConfirmation(newSourceInfo.duration, outOfRangeItems, function() {
                            pendingSourceChange = {
                                resourceId: newSourceInfo.resourceId,
                                src: newSourceInfo.src,
                                duration: newSourceInfo.duration,
                                thumb: newSourceInfo.thumb,
                                outOfRangeItems: outOfRangeItems
                            };
                            sourceChangeConfirmed = true;
                            saveHypervideoLocally();
                        }, function() {
                            EditHypervideoForm.find('.videoResourceList .resourceThumb').removeClass('selected');
                            if (originalResourceId) {
                                EditHypervideoForm.find('.videoResourceList .resourceThumb[data-resourceID="' + originalResourceId + '"]').addClass('selected');
                                EditHypervideoForm.find('input[name="newResourceId"]').val(originalResourceId);
                            } else {
                                EditHypervideoForm.find('input[name="newResourceId"]').val('');
                            }
                            var tabs = EditHypervideoForm.find('.videoSourceTabs');
                            tabs.tabs('option', 'active', isCanvasVideo ? 1 : 0);
                        });
                        return;
                    }
                }

                pendingSourceChange = {
                    resourceId: newSourceInfo.resourceId,
                    src: newSourceInfo.src,
                    duration: newSourceInfo.duration,
                    thumb: newSourceInfo.thumb,
                    outOfRangeItems: null
                };
                sourceChangeConfirmed = true;
            }

            // Canvas video duration validation
            if (isCanvasVideo && !pendingSourceChange) {
                var newDuration = getDurationFromForm();
                if (newDuration < 4) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
                    return;
                }
                if (newDuration < originalDuration) {
                    var outOfRangeItems = getOutOfRangeItems(newDuration);
                    if (outOfRangeItems.hasAffectedItems && !pendingDurationChange) {
                        showDurationChangeConfirmation(newDuration, outOfRangeItems, function() {
                            pendingDurationChange = { newDuration: newDuration, outOfRangeItems: outOfRangeItems };
                            saveHypervideoLocally();
                        }, function() {
                            EditHypervideoForm.find('input[name="duration"]').val(formBuilder.secondsToTimeString(originalDuration));
                        });
                        return;
                    }
                }
            }

            // Subtitles validation
            var err = 0;
            EditHypervideoForm.find('.subtitlesItem').each(function() {
                $(this).css({'outline': ''});
                if (($(this).find('input[type="file"]:first').attr('name') == 'subtitles[]') || ($(this).find('.subtitlesTmpKeySetter').first().val() == '')
                        || ($(this).find('input[type="file"]:first').val().length == 0)) {
                    $(this).css({'outline': '1px solid #cd0a0a'});
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesEmptyFields']);
                    err++;
                } else if ( !(new RegExp('(' + ['.vtt'].join('|').replace(/\./g, '\\.') + ')$')).test($(this).find('input[type="file"]:first').val()) ) {
                    $(this).css({'outline': '1px solid #cd0a0a'});
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesWrongFormat']);
                    err++;
                }
                if (EditHypervideoForm.find('.subtitlesItem input[type="file"][name="subtitles['+ $(this).find('.subtitlesTmpKeySetter:first').val() +']"]').length > 1
                        || (EditHypervideoForm.find('.existingSubtitlesItem .subtitlesDelete[data-lang="'+ $(this).find('.subtitlesTmpKeySetter:first').val() +'"]').length > 0 ) ) {
                    EditHypervideoForm.find('.message.error').addClass('active').html(labels['ErrorSubtitlesLanguageDuplicate']);
                    err++;
                    return false;
                }
            });
            if (err > 0) { return; }

            // Update the database entry from form
            updateDatabaseFromForm();
            var hypervideoData = FrameTrail.module('Database').convertToDatabaseFormat(thisID);

            var adapter = FrameTrail.module('StorageManager').getAdapter();
            var basePath = 'hypervideos/' + thisID;

            var sourceWasChanged = sourceChangeConfirmed;
            var newSourcePath = null;
            if (sourceWasChanged) {
                var srcInfo = getNewSourceInfo();
                newSourcePath = srcInfo.src;
            }

            // Collect subtitle deletions and additions
            var subtitlesToDelete = [];
            EditHypervideoForm.find('.existingSubtitlesItem.markedForDeletion').each(function() {
                var lang = $(this).find('.subtitlesDelete').attr('data-lang');
                if (lang) { subtitlesToDelete.push(lang); }
            });

            var writeTasks = [adapter.writeJSON(basePath + '/hypervideo.json', hypervideoData)];

            // Delete subtitle files
            for (var d = 0; d < subtitlesToDelete.length; d++) {
                writeTasks.push(adapter.deleteFile(basePath + '/subtitles/' + subtitlesToDelete[d] + '.vtt').catch(function() {}));
            }

            // Write new subtitle files
            EditHypervideoForm.find('.newSubtitlesContainer input[type=file]').each(function() {
                var match = /subtitles\[(.+)\]/g.exec($(this).attr('name'));
                if (match && this.files && this.files[0]) {
                    writeTasks.push(
                        adapter.createDirectory(basePath + '/subtitles').then(function() {
                            return adapter.writeFile(basePath + '/subtitles/' + match[1] + '.vtt', this.files[0]);
                        }.bind(this))
                    );
                }
            });

            Promise.all(writeTasks).then(function() {
                // Update annotation sources if video source changed
                if (sourceWasChanged && newSourcePath !== null) {
                    return updateAnnotationSourcesLocally(adapter, thisID, newSourcePath);
                }
            }).then(function() {
                completeUpdate();
            }).catch(function(err) {
                EditHypervideoForm.find('.message.error').addClass('active').html('Local save failed: ' + (err ? err.message : ''));
            });
        }

        /**
         * Update the target.source in all annotation files for a hypervideo.
         */
        function updateAnnotationSourcesLocally(adapter, hvID, newSourcePath) {
            var basePath = 'hypervideos/' + hvID + '/annotations';
            return adapter.listDirectory(basePath).then(function(files) {
                var tasks = [];
                for (var i = 0; i < files.length; i++) {
                    if (files[i] === '_index.json') continue;
                    if (!/\.json$/.test(files[i])) continue;
                    tasks.push((function(filename) {
                        return adapter.readJSON(basePath + '/' + filename).then(function(content) {
                            if (!Array.isArray(content)) return;
                            var modified = false;
                            for (var j = 0; j < content.length; j++) {
                                if (content[j].target && content[j].target.source) {
                                    content[j].target.source = newSourcePath;
                                    modified = true;
                                }
                            }
                            if (modified) {
                                return adapter.writeJSON(basePath + '/' + filename, content);
                            }
                        });
                    })(files[i]));
                }
                return Promise.all(tasks);
            }).catch(function() {});
        }

        var hypervideoDialog = $('<div class="hypervideoSettingsDialog"></div>');
        hypervideoDialog.append(EditHypervideoForm);

        hypervideoDialogCtrl = Dialog({
            title:   labels['SettingsHypervideoSettings'],
            modal:   true,
            width:   830,
            height:  600,
            content: hypervideoDialog,
            close: function() {
                hypervideoDialogCtrl.destroy();
            },
            buttons: [
                { text: labels['GenericSaveChanges'] || labels['GenericApply'] || 'Save',
                    click: function() {
                        if (FrameTrail.getState('storageMode') === 'local') {
                            saveHypervideoLocally();
                        } else {
                            EditHypervideoForm.submit();
                        }
                    }
                },
                { text: labels['GenericCancel'],
                    click: function() {
                        hypervideoDialogCtrl.close();
                    }
                }
            ]
        });
    }

    return {
        open: open
    };

});
