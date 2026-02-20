/**
 * @module Player
 */

/**
 * I am the PlayerLauncher.
 * I am the entry point to the application and i am called from __index.html__ with
 *
 *     $(document).ready( function() {
 *
 *          FrameTrail.start('PlayerLauncher', {
 *              // initial global state
 *          });
 *
 *      } );
 *
 * I initialize all main modules, and then start their init process in the right order.
 * When I am finished, the Application is either up and running, or displays a meaningful
 * error message, why loading has failed.
 * I am a "one-pass" module, this is: I don't export any public methods or properties, and
 * my sole purpose is to start other modules, after which I am discarded.
 *
 * @class PlayerLauncher
 * @static
 * @main
 */

 FrameTrail.defineModule('PlayerLauncher', function(FrameTrail){

    // Set up Localization
    FrameTrail.initModule('Localization');
    var labels = FrameTrail.module('Localization').labels;

    // Set up Overlay interface
    FrameTrail.initModule('InterfaceModal');
    FrameTrail.module('InterfaceModal').showStatusMessage(labels['MessageStateLoadingData']);
    FrameTrail.module('InterfaceModal').showLoadingScreen();

    // Set up the various data models
    FrameTrail.initModule('RouteNavigation');
    FrameTrail.initModule('StorageManager');
    FrameTrail.initModule('UserManagement');
    FrameTrail.initModule('Database');
    FrameTrail.initModule('TagModel');
    FrameTrail.initModule('ResourceManager');
    FrameTrail.initModule('HypervideoFormBuilder');
    FrameTrail.initModule('HypervideoModel');

    // Set up the interface
    FrameTrail.initModule('Interface');

    // Set up the controller
    if (FrameTrail.module('RouteNavigation').hypervideoID) {
        FrameTrail.initModule('HypervideoController');
    }

    // Set up Timeline Controller
    FrameTrail.initModule('TimelineController');

    // Set up User Traces
    FrameTrail.initModule('UserTraces');

    // Set up Undo Manager
    FrameTrail.initModule('UndoManager');


    // Initialize storage, then start the actual init process

    FrameTrail.module('StorageManager').init().then(function() {

        var storageMode = FrameTrail.getState('storageMode');

        if (storageMode === 'needsFolder') {
            // File System Access API available but no folder selected — prompt user
            showFolderPrompt();
            return;
        }

        // Sync login state now that storageMode is known.
        // UserManagement.isLoggedIn() ran at module-init time before storageMode
        // was set, so loggedIn may be stale (false) for local/download modes.
        FrameTrail.module('UserManagement').isLoggedIn(function() {
            continueLoading();
        });

    });

    function continueLoading() {

        if (FrameTrail.module('RouteNavigation').hypervideoID) {

            FrameTrail.module('Database').loadData(

                function () {

                    FrameTrail.module('UserTraces').initTraces();

                    if (FrameTrail.module('Database').config.alwaysForceLogin) {
                        FrameTrail.module('InterfaceModal').hideMessage();
                        FrameTrail.module('UserManagement').ensureAuthenticated(function() {
                            initHypervideo();
                        }, function() {}, true);
                    } else {
                        initHypervideo();
                    }

                    function initHypervideo() {

                        FrameTrail.module('TagModel').initTagModel(

                            function () {

                                FrameTrail.module('InterfaceModal').setLoadingTitle(FrameTrail.module('Database').hypervideo.name);

                                FrameTrail.module('HypervideoModel').initModel(function(){

                                    FrameTrail.module('Interface').create(function(){

                                        FrameTrail.module('InterfaceModal').hideLoadingScreen();

                                        FrameTrail.module('HypervideoController').initController(

                                            function(){

                                                // Finished
                                                FrameTrail.module('InterfaceModal').hideMessage();

                                                $(FrameTrail.getState('target')).find('.hypervideo video.video').removeClass('nocolor dark');

                                            },

                                            function(errorMsg){

                                                // Fail: Init thread was aborted with:
                                                FrameTrail.module('InterfaceModal').showErrorMessage(errorMsg);

                                            }

                                        );

                                    });


                                });


                            },

                            function () {
                                FrameTrail.module('InterfaceModal').showErrorMessage(labels['ErrorCouldNotInitTagModel']);
                            }

                        );

                    }

                },

                function(errorMsg){

                    // Fail: Init was aborted with:
                    FrameTrail.module('InterfaceModal').showErrorMessage(errorMsg);
                    if (FrameTrail.getState('storageMode') === 'local') {
                        showFolderPrompt();
                    }

                }

            );

        } else {

            FrameTrail.changeState('viewMode', 'overview');

            FrameTrail.module('Database').loadData(

                function(){

                    FrameTrail.module('UserTraces').initTraces();

                    if (FrameTrail.module('Database').config.alwaysForceLogin) {
                        FrameTrail.module('InterfaceModal').hideMessage();
                        FrameTrail.module('UserManagement').ensureAuthenticated(function() {
                            initOverview();
                        }, function() {}, true);
                    } else {
                        initOverview();
                    }

                    function initOverview() {

                        FrameTrail.module('InterfaceModal').setLoadingTitle('Overview');

                        FrameTrail.module('Interface').create(function(){

                            // Finished
                            FrameTrail.module('InterfaceModal').hideMessage();
                            FrameTrail.module('InterfaceModal').hideLoadingScreen();

                        });

                    }

                },

                function(errorMsg){

                    // Fail: Init was aborted with:
                    FrameTrail.module('InterfaceModal').showErrorMessage(errorMsg);
                    if (FrameTrail.getState('storageMode') === 'local') {
                        showFolderPrompt();
                    }

                }

            );

        }

    }


    function showFolderPrompt() {
        FrameTrail.module('InterfaceModal').hideLoadingScreen();
        FrameTrail.module('InterfaceModal').hideMessage();

        var currentFolder = FrameTrail.module('StorageManager').getFolderName();
        var folderInfo = currentFolder
            ? '<p style="margin-top:8px; color:#666;">' + labels['CurrentFolder'] + ': <strong>' + currentFolder + '</strong></p>'
            : '';

        var folderDialog = $('<div class="folderPromptDialog" title="' + labels['SelectDataFolder'] + '">'
            + '<p>' + labels['SelectDataFolderDescription'] + '</p>'
            + folderInfo
            + '</div>');

        folderDialog.dialog({
            modal: true,
            width: 450,
            closeOnEscape: false,
            open: function() { $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide(); },
            buttons: [
                {
                    text: labels['SelectFolder'],
                    click: function() {
                        FrameTrail.module('StorageManager').switchToLocal().then(function() {
                            folderDialog.dialog('close');
                            folderDialog.remove();
                            // Clear hypervideo hash — old ID likely doesn't exist in new folder
                            if (window.location.hash) {
                                window.location.hash = '';
                                window.location.reload();
                                return;
                            }
                            FrameTrail.module('InterfaceModal').showStatusMessage(labels['MessageStateLoadingData']);
                            FrameTrail.module('InterfaceModal').showLoadingScreen();
                            continueLoading();
                        }).catch(function(err) {
                            FrameTrail.module('InterfaceModal').showErrorMessage(labels['ErrorCouldNotAccessFolder'] + ' ' + err.message);
                        });
                    }
                }
            ]
        });
    }


    return null;

});
