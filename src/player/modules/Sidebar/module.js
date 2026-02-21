/**
 * @module Player
 */


/**
 * I am the Sidebar. I provide the basic navigation for the user interface.
 *
 * @class Sidebar
 * @static
 */



FrameTrail.defineModule('Sidebar', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    var domElement  = $(      '<div class="sidebar">'
                            + '    <div class="sidebarContainer">'
                            + '        <div data-viewmode="overview">'
                            + '            <div class="viewmodeControls">'
                            + '                <div class="viewModeActionButtonContainer">'
                            + '                    <button class="newHypervideoButton" data-tooltip-bottom-left="'+ labels['HypervideoNew'] +'"><span class="icon-hypervideo-add"></span></button>'
                            + '                    <button class="exportButton" data-tooltip-bottom-left="'+ labels['GenericExport'] +'"><span class="icon-download"></span></button>'
                            + '                    <div style="clear: both;"></div>'
                            + '                </div>'
                            + '            </div>'
                            + '        </div>'
                            + '        <div data-viewmode="video">'
                            + '            <div class="viewmodeControls">'
                            + '                <div class="viewModeActionButtonContainer">'
                            + '                    <button class="newHypervideoButton" data-tooltip-bottom-left="'+ labels['HypervideoNew'] +'"><span class="icon-hypervideo-add"></span></button>'
                            + '                    <button class="forkButton" data-tooltip-bottom-left="'+ labels['GenericForkHypervideo'] +'"><span class="icon-hypervideo-fork"></span></button>'
                            + '                    <button class="saveButton" data-tooltip-bottom-left="'+ labels['GenericSaveChanges'] +'"><span class="icon-floppy"></span></button>'
                            + '                    <button class="saveAsButton" data-tooltip-bottom-left="'+ labels['GenericSaveAs'] +'"><span class="icon-export"></span></button>'
                            + '                    <button class="undoButton" disabled data-tooltip-bottom-left="'+ labels['GenericUndo'] +'"><span class="icon-ccw"></span></button>'
                            + '                    <button class="redoButton" disabled data-tooltip-bottom-left="'+ labels['GenericRedo'] +'"><span class="icon-cw"></span></button>'
                            + '                    <button class="exportButton" data-tooltip-bottom-left="'+ labels['GenericExportHypervideo'] +'"><span class="icon-download"></span></button>'
                            + '                    <div style="clear: both;"></div>'
                            + '                </div>'
                            + '                <button class="editMode" data-editmode="preview"><span class="icon-eye"></span><span class="editModeLabel">'+ labels['SidebarPreview'] +'</span></button>'
                            + '                <button class="editMode" data-editmode="layout"><span class="icon-website"></span><span class="editModeLabel">'+ labels['SidebarLayout'] +'</span></button>'
                            + '                <button class="editMode" data-editmode="overlays"><span class="icon-object-ungroup"></span><span class="editModeLabel">'+ labels['SidebarOverlays'] +'</span></button>'
                            + '                <button class="editMode" data-editmode="codesnippets"><span class="icon-code"></span><span class="editModeLabel">'+ labels['SidebarCustomCode'] +'</span></button>'
                            + '                <button class="editMode" data-editmode="annotations"><span class="icon-annotations"></span><span class="editModeLabel">'+ labels['SidebarMyAnnotations'] +'<span class="icon-user"></span></button>'
                            + '            </div>'
                            + '            <button class="hypervideoDeleteButton" data-tooltip-top-left="'+ labels['GenericDeleteHypervideo'] +'"><span class="icon-trash"></span></button>'
                            + '        </div>'
                            + '    </div>'
                            + '    </div>'
                            + '</div>'
                        ),

        sidebarContainer       = domElement.find('.sidebarContainer'),
        overviewContainer      = sidebarContainer.children('[data-viewmode="overview"]'),
        videoContainer         = sidebarContainer.children('[data-viewmode="video"]'),
        videoContainerControls = videoContainer.children('.viewmodeControls'),
        resourcesContainer     = sidebarContainer.children('[data-viewmode="resources"]'),

        NewHypervideoButton    = domElement.find('.newHypervideoButton'),
        SaveButton             = domElement.find('.saveButton'),
        SaveAsButton           = domElement.find('.saveAsButton'),
        ForkButton             = domElement.find('.forkButton'),
        ExportButton           = domElement.find('.exportButton'),
        DeleteButton           = domElement.find('.hypervideoDeleteButton'),
        UndoButton             = domElement.find('.undoButton'),
        RedoButton             = domElement.find('.redoButton');


    /**
     * Add a hypervideo locally using the File System Access API adapter.
     * Replicates the server-side hypervideoAdd logic.
     */
    function addHypervideoLocally(newDialog, validateFn, getDurationFn) {
        // Validation
        newDialog.dialog('widget').find('.message.error').removeClass('active').html('');
        if (!validateFn()) {
            var activeTab = newDialog.find('.videoSourceTabs').tabs('option', 'active');
            if (activeTab === 0) {
                newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorSelectVideoFromList']);
            } else if (activeTab === 1) {
                newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
            }
            return;
        }

        var formBuilder = FrameTrail.module('HypervideoFormBuilder');
        var selectedResourcesID = newDialog.find('input[name="resourcesID"]').val() || '';
        var adapter = FrameTrail.module('StorageManager').getAdapter();
        var userInfo = adapter.userInfo;

        var hypervideoData = {
            "meta": {
                "name": newDialog.find('input[name="name"]').val(),
                "description": newDialog.find('textarea[name="description"]').val(),
                "thumb": (selectedResourcesID.length > 0) ? FrameTrail.module('Database').resources[parseInt(selectedResourcesID)].thumb : null,
                "creator": userInfo.name || 'Local User',
                "creatorId": userInfo.id || 'local',
                "created": Date.now(),
                "lastchanged": Date.now()
            },
            "config": {
                "slidingMode": "adjust",
                "slidingTrigger": "key",
                "theme": "",
                "autohideControls": false,
                "captionsVisible": newDialog.find('input[name="config[captionsVisible]"]').is(':checked'),
                "clipTimeVisible": false,
                "hidden": newDialog.find('input[name="hidden"]').is(':checked'),
                "layoutArea": {
                    "areaTop": [],
                    "areaBottom": [],
                    "areaLeft": [],
                    "areaRight": []
                }
            },
            "clips": [
                {
                    "resourceId": (selectedResourcesID.length > 0) ? selectedResourcesID : null,
                    "src": (selectedResourcesID.length > 0) ? FrameTrail.module('Database').resources[parseInt(selectedResourcesID)].src : null,
                    "duration": (selectedResourcesID.length === 0) ? getDurationFn() : 0,
                    "start": 0,
                    "end": 0,
                    "in": 0,
                    "out": 0
                }
            ],
            "globalEvents": {
                "onReady": "",
                "onPlay": "",
                "onPause": "",
                "onEnded": ""
            },
            "customCSS": "",
            "contents": [],
            "subtitles": []
        };

        // Apply config overrides from form
        for (var configKey in hypervideoData.config) {
            var newConfigVal = newDialog.find('input[data-configkey=' + configKey + ']').val();
            newConfigVal = (newConfigVal === 'true')
                            ? true
                            : (newConfigVal === 'false')
                                ? false
                                : (newConfigVal === undefined)
                                    ? hypervideoData.config[configKey]
                                    : newConfigVal;
            hypervideoData.config[configKey] = newConfigVal;
        }

        // Collect subtitle info
        newDialog.find('.newSubtitlesContainer input[type=file]').each(function () {
            var match = /subtitles\[(.+)\]/g.exec($(this).attr('name'));
            if (match) {
                hypervideoData.subtitles.push({
                    "src": match[1] + ".vtt",
                    "srclang": match[1]
                });
            }
        });

        hypervideoData["annotation-increment"] = 1;

        var time = Math.floor(Date.now() / 1000);

        // Read hypervideo index, increment, create folder structure
        adapter.readJSON('hypervideos/_index.json').catch(function() {
            return { 'hypervideo-increment': 0, 'hypervideos': {} };
        }).then(function(hvi) {
            if (!hvi['hypervideo-increment']) { hvi['hypervideo-increment'] = 0; }
            hvi['hypervideo-increment']++;
            var newID = hvi['hypervideo-increment'];
            hvi['hypervideos'][newID] = './' + newID;

            var basePath = 'hypervideos/' + newID;

            var annotationIndex = {
                "mainAnnotation": "1",
                "annotationfiles": {
                    "1": {
                        "name": "main",
                        "description": "",
                        "created": time,
                        "lastchanged": time,
                        "hidden": false,
                        "owner": userInfo.name || 'Local User',
                        "ownerId": String(userInfo.id || 'local')
                    }
                }
            };

            var tasks = [
                adapter.writeJSON('hypervideos/_index.json', hvi),
                adapter.createDirectory(basePath + '/annotations'),
                adapter.createDirectory(basePath + '/subtitles')
            ];

            return Promise.all(tasks).then(function() {
                var writeTasks = [
                    adapter.writeJSON(basePath + '/hypervideo.json', hypervideoData),
                    adapter.writeJSON(basePath + '/annotations/_index.json', annotationIndex),
                    adapter.writeJSON(basePath + '/annotations/1.json', [])
                ];

                // Write subtitle files
                newDialog.find('.newSubtitlesContainer input[type=file]').each(function () {
                    var match = /subtitles\[(.+)\]/g.exec($(this).attr('name'));
                    if (match && this.files && this.files[0]) {
                        writeTasks.push(adapter.writeFile(basePath + '/subtitles/' + match[1] + '.vtt', this.files[0]));
                    }
                });

                return Promise.all(writeTasks);
            });
        }).then(function() {
            newDialog.dialog('close');
            FrameTrail.module('Database').loadHypervideoData(
                function() {
                    FrameTrail.module('ViewOverview').refreshList();
                },
                function() {}
            );
        }).catch(function(err) {
            newDialog.dialog('widget').find('.message.error').addClass('active').html('Local save failed: ' + err.message);
        });
    }

    /**
     * Delete a hypervideo locally.
     * Validates name, removes directory and index entry.
     */
    function deleteHypervideoLocally(deleteDialog, thisID) {
        var hypervideos = FrameTrail.module('Database').hypervideos;
        var enteredName = deleteDialog.find('input[name="hypervideoName"]').val();

        if (enteredName.toLowerCase() !== hypervideos[thisID].name.toLowerCase()) {
            deleteDialog.find('.message.error').addClass('active').html(labels['ErrorHypervideoNameIncorrect']);
            return;
        }

        var adapter = FrameTrail.module('StorageManager').getAdapter();

        adapter.readJSON('hypervideos/_index.json').then(function(hvi) {
            if (!hvi.hypervideos[thisID]) {
                deleteDialog.find('.message.error').addClass('active').html(labels['ErrorHypervideoDoesNotExist']);
                return Promise.reject();
            }
            var hvPath = 'hypervideos/' + hvi.hypervideos[thisID];
            delete hvi.hypervideos[thisID];
            return Promise.all([
                adapter.writeJSON('hypervideos/_index.json', hvi),
                adapter.deleteDirectory(hvPath).catch(function() {})
            ]);
        }).then(function() {
            deleteDialog.dialog('close');
            FrameTrail.module('Database').loadHypervideoData(
                function() {
                    FrameTrail.module('ViewOverview').refreshList();
                    if (thisID == FrameTrail.module('RouteNavigation').hypervideoID) {
                        alert(labels['MessageDeleteHypervideoRedirect']);
                        if (FrameTrail.getState('editMode')) {
                            FrameTrail.changeState('editMode', false);
                        }
                        FrameTrail.module('RouteNavigation').hypervideoID = null;
                        $('.titlebar button[data-viewmode="video"]').hide();
                        window.location.hash = '#';
                        FrameTrail.changeState('viewMode', 'overview');
                    }
                },
                function() {}
            );
        }).catch(function() {});
    }

    /**
     * Fork/clone a hypervideo locally.
     * Copies the entire hypervideo directory and updates the index.
     */
    function forkHypervideoLocally(forkDialog, thisID) {
        var adapter = FrameTrail.module('StorageManager').getAdapter();
        var userInfo = adapter.userInfo;

        var currentData = FrameTrail.module('Database').convertToDatabaseFormat(thisID);
        currentData.meta.name = forkDialog.find('input[name="name"]').val();
        currentData.meta.description = forkDialog.find('textarea[name="description"]').val();
        currentData.meta.creator = userInfo.name || 'Local User';
        currentData.meta.creatorId = userInfo.id || 'local';
        currentData.meta.created = Date.now();
        currentData.meta.lastchanged = Date.now();

        if (!currentData.meta.name || currentData.meta.name.length < 3) {
            forkDialog.find('.message.error').addClass('active').html(labels['ErrorGeneric']);
            return;
        }

        adapter.readJSON('hypervideos/_index.json').then(function(hvi) {
            if (!hvi['hypervideo-increment']) { hvi['hypervideo-increment'] = 0; }
            hvi['hypervideo-increment']++;
            var newID = hvi['hypervideo-increment'];
            var srcPath = 'hypervideos/' + hvi.hypervideos[thisID];
            var destPath = 'hypervideos/' + newID;

            hvi.hypervideos[newID] = './' + newID;

            // Copy the directory, then overwrite hypervideo.json and annotations
            return adapter.copyDirectory(srcPath, destPath).then(function() {
                var time = Math.floor(Date.now() / 1000);
                var annotationIndex = {
                    "mainAnnotation": "1",
                    "annotation-increment": 1,
                    "annotationfiles": {
                        "1": {
                            "name": "main",
                            "description": "",
                            "created": time,
                            "lastchanged": time,
                            "hidden": false,
                            "owner": userInfo.name || 'Local User',
                            "ownerId": String(userInfo.id || 'local')
                        }
                    }
                };

                return Promise.all([
                    adapter.writeJSON('hypervideos/_index.json', hvi),
                    adapter.writeJSON(destPath + '/hypervideo.json', currentData),
                    adapter.writeJSON(destPath + '/annotations/_index.json', annotationIndex),
                    adapter.writeJSON(destPath + '/annotations/1.json', [])
                ]).then(function() {
                    return newID;
                });
            });
        }).then(function(newID) {
            var wasEditMode = FrameTrail.getState('editMode');
            forkDialog.dialog('close');

            FrameTrail.module('Database').loadHypervideoData(
                function() {
                    FrameTrail.module('ViewOverview').refreshList();

                    history.pushState({ editMode: wasEditMode }, '', '#hypervideo=' + newID);

                    if (wasEditMode) {
                        FrameTrail.changeState('editMode', false);
                    }

                    FrameTrail.module('HypervideoModel').updateHypervideo(newID, wasEditMode, true);
                },
                function() {}
            );
        }).catch(function(err) {
            forkDialog.find('.message.error').addClass('active').html('Local fork failed: ' + (err ? err.message : ''));
        });
    }

    NewHypervideoButton.click(function(evt) {

        var formBuilder = FrameTrail.module('HypervideoFormBuilder');
        var defaultHidden = FrameTrail.module('Database').config.defaultHypervideoHidden.toString() === "true";

        var newDialog = $('<div class="newHypervideoDialog" title="'+ labels['HypervideoNew'] +'">'
                        + '    <form class="newHypervideoForm" method="post">'
                        + formBuilder.generateSettingsRow({ hidden: defaultHidden })
                        + '        <hr>'
                        + formBuilder.generateVideoSourceSection({ 
                              duration: 120,  // 2 minutes default
                              showUploadButton: true
                          })
                        + '        <div class="message error"></div>'
                        + '    </form>'
                        + '</div>');

        // Attach subtitle event handlers using shared module
        formBuilder.attachSubtitleHandlers(newDialog);

        // Render video resource list
        FrameTrail.module('ResourceManager').renderList(newDialog.find('.videoResourceList'), true,
            'type',
            'contains',
            ['video', 'youtube', 'vimeo']
        );

        // Store reference to the Add Hypervideo button for enabling/disabling
        var addHypervideoButton = null;

        // Validation function to check if form is valid
        function validateHypervideoForm() {
            var activeTab = newDialog.find('.videoSourceTabs').tabs('option', 'active');
            var isChooseVideoTab = (activeTab === 0); // First tab is ChooseVideo
            var isEmptyVideoTab = (activeTab === 1); // Second tab is EmptyVideo
            
            if (isChooseVideoTab) {
                // Choose Video tab: must have a selected video
                var hasSelectedVideo = newDialog.find('.resourceThumb.selected').length > 0;
                return hasSelectedVideo;
            } else if (isEmptyVideoTab) {
                // Empty Video tab: must have duration >= 4 seconds
                var durationValue = formBuilder.timeStringToSeconds(newDialog.find('input[name="duration"]').val());
                return durationValue >= 4;
            }
            
            return false;
        }
        
        // Get duration in seconds from time input
        function getDurationFromInputs() {
            return formBuilder.timeStringToSeconds(newDialog.find('input[name="duration"]').val());
        }

        // Function to update the Add Hypervideo button state
        function updateAddButtonState() {
            if (addHypervideoButton) {
                var isValid = validateHypervideoForm();
                addHypervideoButton.button(isValid ? 'enable' : 'disable');
            }
        }

        $('body').on('click.hypervideoAddResourcesItem', '.newHypervideoDialog .resourceThumb', function() {

            newDialog.find('.resourceThumb').removeClass('selected');
            $(this).addClass('selected');
            newDialog.find('input[name="resourcesID"]').val($(this).data('resourceid'));
            
            // Update button state when video is selected
            updateAddButtonState();

        });

        newDialog.find('.videoSourceTabs').tabs({
            activate: function(event, ui) {
                if ( ui.newPanel.attr('id') == 'EmptyVideo' ) {
                    newDialog.find('input[name="resourcesID"]').prop('disabled',true);
                    newDialog.find('input[name="duration"]').prop('disabled',false);
                    newDialog.find('.resourceThumb').removeClass('selected');
                } else {
                    newDialog.find('input[name="resourcesID"]').prop('disabled',false);
                    newDialog.find('input[name="duration"]').prop('disabled',true);
                }
                
                // Update button state when tab changes
                updateAddButtonState();
            }
        });

        // Listen for changes to the duration input
        newDialog.on('input change', 'input[name="duration"]', function() {
            updateAddButtonState();
        });

        newDialog.find('.newHypervideoForm').ajaxForm({
            method:     'POST',
            url:        '_server/ajaxServer.php',
            beforeSubmit: function (array, form, options) {

                var selectedResourcesID = $('.newHypervideoForm').find('input[name="resourcesID"]').val();
                //console.log(FrameTrail.module('Database').resources[parseInt(selectedResourcesID)]);

                var hypervideoData = {
                    "meta": {
                        "name": $('.newHypervideoForm').find('input[name="name"]').val(),
                        "description": $('.newHypervideoForm').find('textarea[name="description"]').val(),
                        "thumb": (selectedResourcesID.length > 0) ? FrameTrail.module('Database').resources[parseInt(selectedResourcesID)].thumb : null,
                        "creator": FrameTrail.module('Database').users[FrameTrail.module('UserManagement').userID].name,
                        "creatorId": FrameTrail.module('UserManagement').userID,
                        "created": Date.now(),
                        "lastchanged": Date.now()
                    },
                    "config": {
                        "slidingMode": "adjust",
                        "slidingTrigger": "key",
                        "theme": "",
                        "autohideControls": false,
                        "captionsVisible": $('.newHypervideoForm').find('input[name="config[captionsVisible]"]').is(':checked'),
                        "clipTimeVisible": false,
                        "hidden": $('.newHypervideoForm').find('input[name="hidden"]').is(':checked'),
                        "layoutArea": {
                            "areaTop": [],
                            "areaBottom": [],
                            "areaLeft": [],
                            "areaRight": []
                        }
                    },
                    "clips": [
                        {
                            "resourceId": (selectedResourcesID.length > 0) ? selectedResourcesID : null,
                            "src": (selectedResourcesID.length > 0) ? FrameTrail.module('Database').resources[parseInt(selectedResourcesID)].src : null,
                            "duration": (selectedResourcesID.length === 0) ? getDurationFromInputs() : 0,
                            "start": 0,
                            "end": 0,
                            "in": 0,
                            "out": 0
                        }
                    ],
                    "globalEvents": {
                        "onReady": "",
                        "onPlay": "",
                        "onPause": "",
                        "onEnded": ""
                    },
                    "customCSS": "",
                    "contents": [],
                    "subtitles": []
                };

                for (var configKey in hypervideoData.config) {
                    var newConfigVal = $('.newHypervideoForm').find('input[data-configkey=' + configKey + ']').val();
                    newConfigVal = (newConfigVal === 'true')
                                    ? true
                                    : (newConfigVal === 'false')
                                        ? false
                                        : (newConfigVal === undefined)
                                            ? hypervideoData.config[configKey]
                                            : newConfigVal;
                    hypervideoData.config[configKey] = newConfigVal;
                }

                $('.newHypervideoForm').find('.newSubtitlesContainer').find('input[type=file]').each(function () {

                    var match = /subtitles\[(.+)\]/g.exec($(this).attr('name'));

                    if (match) {
                        hypervideoData.subtitles.push({
                            "src": match[1] +".vtt",
                            "srclang": match[1]
                        });
                    }
                });

                //console.log(hypervideoData);

                array.push({ name: 'src', value: JSON.stringify(hypervideoData, null, 4) });

            },
            beforeSerialize: function() {

                // Video/Empty Video Validation
                newDialog.dialog('widget').find('.message.error').removeClass('active').html('');

                if (!validateHypervideoForm()) {
                    var activeTab = newDialog.find('.videoSourceTabs').tabs('option', 'active');
                    var isChooseVideoTab = (activeTab === 0);
                    var isEmptyVideoTab = (activeTab === 1);
                    
                    if (isChooseVideoTab) {
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorSelectVideoFromList']);
                    } else if (isEmptyVideoTab) {
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorDurationMinimum4Seconds']);
                    } else {
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorChooseVideoOrSetDuration']);
                    }
                    return false;
                }

                // Subtitles Validation
                var err = 0;
                newDialog.find('.subtitlesItem').each(function() {
                    $(this).css({'outline': ''});

                    if (($(this).find('input[type="file"]:first').attr('name') == 'subtitles[]') || ($(this).find('.subtitlesTmpKeySetter').first().val() == '') || ($(this).find('input[type="file"]:first').val().length == 0)) {
                        $(this).css({'outline': '1px solid #cd0a0a'});
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorSubtitlesEmptyFields']);
                        err++;
                    } else if ( !(new RegExp('(' + ['.vtt'].join('|').replace(/\./g, '\\.') + ')$')).test($(this).find('input[type="file"]:first').val()) ) {
                        $(this).css({'outline': '1px solid #cd0a0a'});
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorSubtitlesWrongFormat']);
                        err++;
                    }

                    if (newDialog.find('.subtitlesItem input[type="file"][name="subtitles['+ $(this).find('.subtitlesTmpKeySetter:first').val() +']"]').length > 1 ) {
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(labels['ErrorSubtitlesLanguageDuplicate']);
                        return false;
                    }

                });
                if (err > 0) {
                    return false;
                }

            },
            dataType:   'json',
            data: {'a': 'hypervideoAdd'},
            success: function(response) {
                switch(response['code']) {
                    case 0:
                        newDialog.dialog('close');
                        FrameTrail.module('Database').loadHypervideoData(
                            function(){
                                FrameTrail.module('ViewOverview').refreshList();
                            },
                            function(){}
                        );
                        break;
                    default:
                        newDialog.dialog('widget').find('.message.error').addClass('active').html(response['string']);
                        break;
                }
            }
        });


        newDialog.find('.uploadNewVideoResource').click(function(){

            FrameTrail.module('ResourceManager').uploadResource(function(){

                var videoResourceList = newDialog.find('.videoResourceList');
                videoResourceList.empty();

                FrameTrail.module('ResourceManager').renderList(videoResourceList, true,
                    'type',
                    'contains',
                    ['video', 'youtube', 'vimeo']
                );

            }, true);

        })


        newDialog.dialog({
            modal: true,
            resizable: false,
            width:      830,
            height:     600,
            create: function() {
                newDialog.find('.message.error').appendTo($(this).dialog('widget').find('.ui-dialog-buttonpane'));
                
                // Store reference to the Add Hypervideo button and disable it initially
                var buttonPane = $(this).dialog('widget').find('.ui-dialog-buttonpane');
                addHypervideoButton = buttonPane.find('button').first();
                addHypervideoButton.button('disable');
            },
            open: function() {
                // Update button state when dialog opens (in case resources are already loaded)
                updateAddButtonState();
            },
            close: function() {
                $('body').off('click.hypervideoAddResourcesItem');
                $(this).dialog('close');
                $(this).remove();
            },
            buttons: [
                { text: labels['HypervideoAdd'],
                    click: function() {
                        if (FrameTrail.getState('storageMode') === 'local') {
                            addHypervideoLocally(newDialog, validateHypervideoForm, getDurationFromInputs);
                        } else {
                            $('.newHypervideoForm').submit();
                        }
                    }
                },
                { text: labels['GenericCancel'],
                    click: function() {
                        $( this ).dialog( 'close' );
                    }
                }
            ]
        });

    });

    SaveButton.click(function(){
        if (FrameTrail.module('StorageManager').canSave()) {
            FrameTrail.module('HypervideoModel').save();
        } else {
            FrameTrail.module('HypervideoModel').saveAs();
        }
    });

    SaveAsButton.click(function(){
        FrameTrail.module('HypervideoModel').saveAs();
    });

    UndoButton.click(function(){
        FrameTrail.module('UndoManager').undo();
    });

    RedoButton.click(function(){
        FrameTrail.module('UndoManager').redo();
    });

    // Listen for undo state changes to update button states
    FrameTrail.addEventListener('undoStateChanged', function(evt) {
        var state = evt.detail;
        UndoButton.prop('disabled', !state.canUndo);
        RedoButton.prop('disabled', !state.canRedo);

        // Update tooltips with action descriptions
        if (state.undoDescription) {
            UndoButton.attr('data-tooltip-bottom-left', labels['GenericUndo'] + ': ' + state.undoDescription);
        } else {
            UndoButton.attr('data-tooltip-bottom-left', labels['GenericUndo']);
        }
        if (state.redoDescription) {
            RedoButton.attr('data-tooltip-bottom-left', labels['GenericRedo'] + ': ' + state.redoDescription);
        } else {
            RedoButton.attr('data-tooltip-bottom-left', labels['GenericRedo']);
        }
    });

    ForkButton.click(function(evt) {

        evt.preventDefault();
        evt.stopPropagation();

        var thisID = FrameTrail.module('RouteNavigation').hypervideoID,
            thisHypervideo = FrameTrail.module('Database').hypervideo;

        var forkDialog = $('<div class="forkHypervideoDialog" title="'+ labels['GenericForkHypervideo'] +'">'
                         + '    <div class="message active">'+ labels['MessageForkHypervideo'] +'</div>'
                         + '    <form method="POST" class="forkHypervideoForm">'
                         + '        <input type="text" name="name" placeholder="" value="'+ thisHypervideo.name +'"><br>'
                         + '        <textarea name="description" placeholder="">'+ thisHypervideo.description +'</textarea><br>'
                         + '        <div class="message error"></div>'
                         + '    </form>'
                         + '</div>');

        forkDialog.find('.forkHypervideoForm').ajaxForm({
            method:     'POST',
            url:        '_server/ajaxServer.php',
            dataType:   'json',
            thisID: thisID,
            data: {'a': 'hypervideoClone', 'hypervideoID': thisID},
            beforeSubmit: function (array, form, options) {

                var currentData = FrameTrail.module("Database").convertToDatabaseFormat(thisID);

                //console.log(currentData);
                currentData.meta.name = $('.forkHypervideoForm').find('input[name="name"]').val();
                currentData.meta.description = $('.forkHypervideoForm').find('textarea[name="description"]').val();
                currentData.meta.creator = FrameTrail.module('Database').users[FrameTrail.module('UserManagement').userID].name;
                currentData.meta.creatorId = FrameTrail.module('UserManagement').userID;

                array.push({ name: 'src', value: JSON.stringify(currentData, null, 4) });

            },
            success: function(response) {
                switch(response['code']) {
                    case 0:
                        var wasEditMode = FrameTrail.getState('editMode');

                        forkDialog.dialog('close');
                        FrameTrail.module('Database').loadHypervideoData(
                            function(){
                                FrameTrail.module('ViewOverview').refreshList();

                                var newHypervideoID = response['newHypervideoID'];

                                // Update URL hash with new hypervideo ID
                                history.pushState({
                                    editMode: wasEditMode
                                }, "", "#hypervideo=" + newHypervideoID);

                                // Exit edit mode if active (will be restored by updateHypervideo if wasEditMode is true)
                                if (wasEditMode) {
                                    FrameTrail.changeState('editMode', false);
                                }

                                // Switch to the new hypervideo, restoring edit mode if it was active
                                FrameTrail.module('HypervideoModel').updateHypervideo(newHypervideoID, wasEditMode, true);
                            },
                            function(){}
                        );

                        break;
                    default:
                        //TODO: push nice error texts into error box.
                        forkDialog.find('.message.error').addClass('active').html(labels['ErrorGeneric']);
                        break;
                }
            }
        });

        forkDialog.dialog({
            modal: true,
            resizable: false,
            close: function() {
                $(this).dialog('close');
                $(this).remove();
            },
            buttons: [
                { text: labels['GenericForkHypervideo'],
                    click: function() {
                        if (FrameTrail.getState('storageMode') === 'local') {
                            forkHypervideoLocally(forkDialog, thisID);
                        } else {
                            $('.forkHypervideoForm').submit();
                        }
                    }
                },
                { text: labels['GenericCancel'],
                    click: function() {
                        $( this ).dialog( 'close' );
                    }
                }
            ]
        });

    });

    ExportButton.click(function(){
        FrameTrail.module('HypervideoModel').exportIt();
    });

    DeleteButton.click(function(evt) {

        evt.preventDefault();
        evt.stopPropagation();

        var thisID = FrameTrail.module('RouteNavigation').hypervideoID,
            hypervideos = FrameTrail.module('Database').hypervideos;

        var deleteDialog = $('<div class="deleteHypervideoDialog" title="'+ labels['GenericDeleteHypervideo'] +'">'
                           + '<div>'+ labels['MessageDeleteHypervideoQuestion'] +'</div>'
                           + '    <input class="thisHypervideoName" type="text" value="'+ hypervideos[thisID]['name'] +'" readonly>'
                           + '    <div class="message active">'+ labels['MessageDeleteHypervideoReEnter'] +':</div>'
                           + '    <form method="POST" class="deleteHypervideoForm">'
                           + '        <input type="text" name="hypervideoName" placeholder="'+ labels['GenericName'] +'"><br>'
                           + '        <div class="message error"></div>'
                           + '    </form>'
                           + '</div>');


        deleteDialog.find('.deleteHypervideoForm').ajaxForm({
            method:     'POST',
            url:        '_server/ajaxServer.php',
            dataType:   'json',
            thisID: thisID,
            data: {a: 'hypervideoDelete', hypervideoID: thisID},
            success: function(response) {
                switch(response['code']) {
                    case 0:
                        deleteDialog.dialog('close');

                        // Refresh the hypervideo list to remove deleted entry
                        FrameTrail.module('Database').loadHypervideoData(
                            function(){
                                FrameTrail.module('ViewOverview').refreshList();

                                // Redirect to Overview when current Hypervideo has been deleted
                                if ( thisID == FrameTrail.module('RouteNavigation').hypervideoID ) {
                                    alert(labels['MessageDeleteHypervideoRedirect']);

                                    // Exit edit mode if active
                                    if (FrameTrail.getState('editMode')) {
                                        FrameTrail.changeState('editMode', false);
                                    }

                                    // Clear the current hypervideo reference
                                    FrameTrail.module('RouteNavigation').hypervideoID = null;

                                    // Hide the video mode button since no hypervideo is selected
                                    $('.titlebar button[data-viewmode="video"]').hide();

                                    // Update URL and switch to overview
                                    window.location.hash = "#";
                                    FrameTrail.changeState('viewMode', 'overview');
                                }
                            },
                            function(){}
                        );

                    break;
                    case 1:
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorNotLoggedIn']);
                    break;
                    case 2:
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorNotActivated']);
                    break;
                    case 3:
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorCouldNotFindHypervideoDirectory']);
                    break;
                    case 4:
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorHypervideoDoesNotExist']);
                    break;
                    case 5:
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorHypervideoNameIncorrect']);
                    break;
                    case 6:
                        //TODO push nice texts into error box.
                        deleteDialog.find('.message.error').addClass('active').html(labels['ErrorHypervideoPermissionDenied']);
                    break;
                }
            }
        });

        deleteDialog.dialog({
                modal: true,
                resizable: false,
                open: function() {
                    deleteDialog.find('.thisHypervideoName').focus().select();
                },
                close: function() {
                    $(this).dialog('close');
                    $(this).remove();
                },
                buttons: [
                    { text: labels['GenericDeleteHypervideo'],
                        click: function() {
                            if (FrameTrail.getState('storageMode') === 'local') {
                                deleteHypervideoLocally(deleteDialog, thisID);
                            } else {
                                $('.deleteHypervideoForm').submit();
                            }
                        }
                    },
                    { text: labels['GenericCancel'],
                        click: function() {
                            $( this ).dialog( 'close' );
                        }
                    }
                ]
            });

    });


    videoContainerControls.find('.editMode').click(function(evt){
        FrameTrail.changeState('editMode', ($(this).attr('data-editmode')));
    });


    /**
     * I am called from {{#crossLink "Interface/create:method"}}Interface/create(){{/crossLink}} and set up all my elements.
     * @method create
     */
    function create() {

        toggleSidebarOpen(FrameTrail.getState('sidebarOpen'));
        changeViewSize(FrameTrail.getState('viewSize'));
        toggleFullscreen(FrameTrail.getState('fullscreen'));
        toogleUnsavedChanges(FrameTrail.getState('unsavedChanges'));
        toggleViewMode(FrameTrail.getState('viewMode'));
        toggleEditMode(FrameTrail.getState('editMode'));

        $(FrameTrail.getState('target')).append(domElement);

        if ( FrameTrail.getState('embed') ) {
            //domElement.find('.viewmodeControls').hide();
        }



    };


    /**
     * I react to a change in the global state "sidebarOpen"
     * @method toggleSidebarOpen
     * @param {Boolean} opened
     */
    function toggleSidebarOpen(opened) {

        if (opened) {
            domElement.addClass('open');
        } else {
            domElement.removeClass('open');
        }

    };


    /**
     * I react to a change in the global state "viewSize"
     * @method changeViewSize
     * @param {Array} arrayWidthAndHeight
     */
    function changeViewSize(arrayWidthAndHeight) {

        

    };


    /**
     * I react to a change in the global state "fullscreen"
     * @method toggleFullscreen
     * @param {Boolean} aBoolean
     */
    function toggleFullscreen(aBoolean) {



    };


    /**
     * I react to a change in the global state "unsavedChanges"
     * @method toogleUnsavedChanges
     * @param {Boolean} aBoolean
     */
    function toogleUnsavedChanges(aBoolean) {

        var noDirectSave = FrameTrail.getState('storageMode') === 'download' ||
                           FrameTrail.module('UserManagement').isGuestMode();

        if (aBoolean) {
            domElement.find('button[data-viewmode="video"]').addClass('unsavedChanges');
            if (noDirectSave) {
                SaveAsButton.addClass('unsavedChanges');
            } else {
                SaveButton.addClass('unsavedChanges');
            }
        } else {
            domElement.find('button[data-viewmode="video"]').removeClass('unsavedChanges');
            domElement.find('button.editMode').removeClass('unsavedChanges');
            SaveButton.removeClass('unsavedChanges');
            SaveAsButton.removeClass('unsavedChanges');
        }

    };

    /**
     * I am called from the {{#crossLink "HypervideoModel/newUnsavedChange:method"}}HypervideoModel/newUnsavedChange(){{/crossLink}}.
     *
     * I mark the categories (overlays, annotations, codeSnippets), which have unsaved changes inside them.
     *
     * @method newUnsavedChange
     * @param {String} category
     */
    function newUnsavedChange(category) {

        if (category == 'codeSnippets' || category == 'events' || category == 'customCSS') {
            // camelCase not valid in attributes
            domElement.find('button[data-editmode="codesnippets"]').addClass('unsavedChanges');
        } else if (category == 'layout') {
            domElement.find('button[data-editmode="layout"]').addClass('unsavedChanges');
        } else {
            domElement.find('button[data-editmode="'+category+'"]').addClass('unsavedChanges');
        }

    };



    /**
     * I react to a change in the global state "viewMode"
     * @method toggleViewMode
     * @param {String} viewMode
     */
    function toggleViewMode(viewMode) {

        sidebarContainer.children().removeClass('active');

        domElement.find('[data-viewmode=' + viewMode + ']').addClass('active');

        changeViewSize();

        // Update button permissions when entering video mode (after hypervideo switch)
        if (viewMode === 'video') {
            updateEditModeButtonPermissions();
        }

    };

    /**
     * I react to a change in the global state "editMode"
     * @method toggleEditMode
     * @param {String} editMode
     * @param {String} oldEditMode
     */
    function toggleEditMode(editMode, oldEditMode){

        if (editMode) {

            domElement.addClass('editActive');

            if (oldEditMode === false) {

                var _canSave = FrameTrail.module('StorageManager').canSave();
                var _isGuest = FrameTrail.module('UserManagement').isGuestMode();
                NewHypervideoButton.show().prop('disabled', _isGuest);
                ForkButton.prop('disabled', _isGuest);
                DeleteButton.prop('disabled', _isGuest);
                ExportButton.hide();
                SaveButton.show().prop('disabled', !_canSave);
                SaveAsButton.show();
                UndoButton.show();
                RedoButton.show();

                videoContainerControls.find('.editMode').addClass('inEditMode');

            }

            videoContainerControls.find('.editMode').removeClass('active');

            videoContainerControls.find('[data-editmode="' + editMode + '"]').addClass('active');

            FrameTrail.changeState('sidebarOpen', true);


        } else {

            domElement.removeClass('editActive');

            NewHypervideoButton.hide();
            //ExportButton.show();
            SaveButton.hide();
            SaveAsButton.hide();
            UndoButton.hide();
            RedoButton.hide();

            videoContainerControls.find('.editMode').removeClass('inEditMode');

            FrameTrail.changeState('sidebarOpen', false);

        }

        changeViewSize();


    }


    /**
     * I update the disabled state of edit mode buttons based on user permissions.
     * Admins and hypervideo owners can edit all aspects (layout, overlays, codesnippets).
     * Other users can only edit annotations.
     * @method updateEditModeButtonPermissions
     */
    function updateEditModeButtonPermissions() {

        if (!FrameTrail.getState('loggedIn')) {
            return;
        }

        if (FrameTrail.module('RouteNavigation').hypervideoID) {
            if (FrameTrail.module('UserManagement').userRole == 'admin' || parseInt(FrameTrail.module('HypervideoModel').creatorId) == FrameTrail.module('UserManagement').userID) {
                // Admin or owner: enable all buttons
                videoContainerControls.find('.editMode').removeClass('disabled');
            } else {
                // Non-owner: disable layout, overlays, codesnippets (can only edit annotations)
                videoContainerControls.find('.editMode').removeClass('disabled');
                videoContainerControls.find('.editMode[data-editmode="layout"]').addClass('disabled');
                videoContainerControls.find('.editMode[data-editmode="overlays"]').addClass('disabled');
                videoContainerControls.find('.editMode[data-editmode="codesnippets"]').addClass('disabled');
            }
        }

    }


    /**
     * I react to a change in the global state "loggedIn"
     * @method changeUserLogin
     * @param {Boolean} loggedIn
     */
    function changeUserLogin(loggedIn) {

        if (loggedIn) {
            updateEditModeButtonPermissions();
        }

    }




    return {

        create: create,

        onChange: {
            sidebarOpen:    toggleSidebarOpen,
            viewSize:       changeViewSize,
            fullscreen:     toggleFullscreen,
            unsavedChanges: toogleUnsavedChanges,
            viewMode:       toggleViewMode,
            editMode:       toggleEditMode,
            loggedIn:       changeUserLogin
        },

        newUnsavedChange: newUnsavedChange,

        /**
         * I am the width of the sidebar's DOM element.
         * @attribute width
         * @type Number
         * @readOnly
         */
        get width() { return domElement.width() }

    };

});
