/**
 * @module Player
 */


/**
 * I am the ViewOverview
 *
 * @class ViewOverview
 * @static
 */


FrameTrail.defineModule('ViewOverview', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    var _domWrapper = document.createElement('div');
    _domWrapper.innerHTML = '<div class="viewOverview"><div class="overviewList"></div></div>';
    var domElement = _domWrapper.firstElementChild,
        OverviewList = domElement.querySelector('.overviewList'),

        animationElement      = null,
        lastSelectedThumb     = null;




    /**
     * Description
     * @method create
     * @return
     */
    function create() {

        var _t = FrameTrail.getState('target');
        var _targetEl = (typeof _t === 'string') ? document.querySelector(_t) : _t;
        _targetEl.querySelector('.mainContainer').append(domElement);

        toggleViewMode(FrameTrail.getState('viewMode'));
        toggleEditMode(FrameTrail.getState('editMode'));


    };


    /**
     * Description
     * @method initList
     * @return
     */
    function initList() {

        var hypervideos = FrameTrail.module('Database').hypervideos,
            hypervideo,
            thumb,
            owner,
            admin = FrameTrail.module('UserManagement').userRole === 'admin',
            editMode = FrameTrail.getState('editMode');
            userColor = FrameTrail.getState('userColor');

        OverviewList.querySelectorAll('.hypervideoThumb').forEach(function(el) { el.remove(); });

        for (var id in hypervideos) {

            owner = hypervideos[id].creatorId === FrameTrail.module('UserManagement').userID;


            if ( !hypervideos[id].hidden || owner || admin ) {

                hypervideo = FrameTrail.newObject('Hypervideo', hypervideos[id])

                thumb = hypervideo.renderThumb();


                if ( (admin || owner) && editMode && FrameTrail.module('StorageManager').canSave() ) {

                    var hypervideoOptions = document.createElement('div');
                    hypervideoOptions.className = 'hypervideoOptions';

                    var editButton = document.createElement('button');
                    editButton.className = 'hypervideoEditButton';
                    editButton.setAttribute('data-tooltip-bottom', labels['SettingsHypervideoSettings']);
                    editButton.innerHTML = '<span class="icon-pencil"></span>';

                    // Capture the hypervideoID in the closure to avoid referencing the last thumb
                    (function(hypervideoID) {
                        editButton.addEventListener('click', function(evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            FrameTrail.module('HypervideoSettingsDialog').open(hypervideoID);
                        });
                    })(id);

                    hypervideoOptions.append(editButton);
                    thumb.append(hypervideoOptions);

                }

                /*
                if (owner && editMode ) {

                    thumb.classList.add('owner');
                    thumb.style.borderColor = '#' + userColor;

                }
                */

                if ( thumb.dataset.hypervideoid == FrameTrail.module('RouteNavigation').hypervideoID ) {
                    thumb.classList.add('activeHypervideo');
                }

                thumb.style.transitionDuration = '0ms';

                // open hypervideo without reloading the page
                thumb.addEventListener('click', function(evt) {

                    // prevent opening href location
                    evt.preventDefault();
                    evt.stopPropagation();

                    var clickedThumb = this;
                    var newHypervideoID = clickedThumb.dataset.hypervideoid,
                        update = (FrameTrail.module('RouteNavigation').hypervideoID == undefined) ? false : true;

                    // Store reference to clicked thumb for animation
                    lastSelectedThumb = clickedThumb;

                    //TODO: PUT IN SEPARATE FUNCTION

                    if ( FrameTrail.module('RouteNavigation').hypervideoID == newHypervideoID ) {

                        // Store the clicked thumb for animation in toggleViewMode
                        lastSelectedThumb = clickedThumb;

                        // Just switch to video view - animation will happen in toggleViewMode
                        FrameTrail.changeState('viewMode', 'video');

                    } else {

                        if ( FrameTrail.getState('editMode') && FrameTrail.getState('unsavedChanges') ) {

                            var confirmDialog = document.createElement('div');
                            confirmDialog.className = 'confirmSaveChanges';
                            confirmDialog.innerHTML = '<div class="message active">'+ labels['MessageSaveChanges'] +'</div>'
                                                    + '<p>'+ labels['MessageSaveChangesQuestion'] +'</p>';

                            var confirmDialogCtrl = Dialog({
                              title:     labels['MessageSaveChangesQuestionShort'],
                              content:   confirmDialog,
                              resizable: false,
                              modal:     true,
                              close: function() {
                                confirmDialogCtrl.destroy();
                              },
                              buttons: {
                                'Yes': function() {

                                    // TODO: Show saving indicator in dialog

                                    FrameTrail.module('HypervideoModel').save(function(){

                                        if (window.FrameTrail.instances.length <= 1) {
                                            history.pushState({
                                                editMode: FrameTrail.getState('editMode')
                                            }, "", "#hypervideo=" + newHypervideoID);
                                        }

                                        FrameTrail.changeState('editMode', false);

                                        confirmDialogCtrl.close();

                                        OverviewList.querySelectorAll('.hypervideoThumb.activeHypervideo').forEach(function(el) { el.classList.remove('activeHypervideo'); });
                                        var _newThumb = OverviewList.querySelector('.hypervideoThumb[data-hypervideoid="'+ newHypervideoID +'"]');
                                        if (_newThumb) _newThumb.classList.add('activeHypervideo');

                                        FrameTrail.module('HypervideoModel').updateHypervideo(newHypervideoID, true, update);

                                    });

                                },
                                'No, discard': function() {

                                    FrameTrail.changeState('unsavedChanges', false);

                                    confirmDialogCtrl.close();

                                    // TODO: Reload new hypervideo
                                    window.location.reload();

                                },
                                Cancel: function() {
                                  confirmDialogCtrl.close();
                                }
                              }
                            });



                        } else {

                            OverviewList.querySelectorAll('.hypervideoThumb.activeHypervideo').forEach(function(el) { el.classList.remove('activeHypervideo'); });
                            var _newThumb = OverviewList.querySelector('.hypervideoThumb[data-hypervideoid="'+ newHypervideoID +'"]');
                            if (_newThumb) _newThumb.classList.add('activeHypervideo');

                            if (window.FrameTrail.instances.length <= 1) {
                                history.pushState({
                                    editMode: FrameTrail.getState('editMode')
                                }, "", "#hypervideo=" + newHypervideoID);
                            }

                            if ( FrameTrail.getState('editMode') ) {

                                FrameTrail.changeState('editMode', false);

                                FrameTrail.module('HypervideoModel').updateHypervideo(newHypervideoID, true, update);

                            } else {

                                FrameTrail.module('HypervideoModel').updateHypervideo(newHypervideoID, false, update);

                            }

                        }



                    }


                    //TODO END




                });

                OverviewList.append(thumb);

            }


        }

        changeViewSize();
        OverviewList.querySelectorAll('.hypervideoThumb').forEach(function(el) { el.style.transitionDuration = ''; });

    }


    /**
     * Description
     * @method toggleSidebarOpen
     * @param {} opened
     * @return
     */
    function toggleSidebarOpen(opened) {

        if ( FrameTrail.getState('viewMode') === 'overview' ) {
            changeViewSize();
        }

    };


    /**
     * Description
     * @method changeViewSize
     * @param {} arrayWidthAndHeight
     * @return
     */
    function changeViewSize(arrayWidthAndHeight) {

        if ( FrameTrail.getState('viewMode') != 'overview' ) return;



    };


    /**
     * Description
     * @method toggleFullscreen
     * @param {} aBoolean
     * @return
     */
    function toggleFullscreen(aBoolean) {


    };


    /**
     * Description
     * @method toogleUnsavedChanges
     * @param {} aBoolean
     * @return
     */
    function toogleUnsavedChanges(aBoolean) {


    };


    /**
     * Animates a hypervideo thumb from its grid position to full mainContainer size
     * @method animateThumbToFullSize
     * @param {HTMLElement} thumbElement The thumb element to animate
     * @param {Function} callback Function to call after animation completes
     * @param {Object} preCapturedRect Optional: thumb rect captured before overview is hidden
     */
    function animateThumbToFullSize(thumbElement, callback, preCapturedRect) {
        var _t = FrameTrail.getState('target');
        var _targetEl = (typeof _t === 'string') ? document.querySelector(_t) : _t;
        var mainContainer = _targetEl.querySelector('.mainContainer');
        var mainContainerRect = mainContainer.getBoundingClientRect();

        // Use pre-captured rect if provided, otherwise get it now
        var thumbRect = preCapturedRect || thumbElement.getBoundingClientRect();

        // Calculate positions relative to mainContainer
        var startWidth = thumbRect.width;
        var startHeight = thumbRect.height;
        var endWidth = mainContainerRect.width;
        var endHeight = mainContainerRect.height;

        // Get video container background color (like closing animation)
        var viewVideo = _targetEl.querySelector('.viewVideo');
        var videoContainer = viewVideo ? viewVideo.querySelector('.videoContainer') : null;
        var bgColor = '#000';
        if (videoContainer) {
            var computedStyle = window.getComputedStyle(videoContainer);
            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                bgColor = computedStyle.backgroundColor;
            }
        }

        // Create simple, scalable animation element (like closing animation)
        animationElement = document.createElement('div');
        Object.assign(animationElement.style, {
            position: 'fixed',
            left: thumbRect.left + 'px',
            top: thumbRect.top + 'px',
            width: startWidth + 'px',
            height: startHeight + 'px',
            margin: '0',
            padding: '0',
            zIndex: '10000',
            pointerEvents: 'none',
            transformOrigin: 'top left',
            overflow: 'hidden',
            backgroundColor: bgColor,
            border: '2px solid var(--primary-fg-color)',
            boxSizing: 'border-box',
            opacity: '1'
        });
        document.body.append(animationElement);

        // Hide the original thumb temporarily
        thumbElement.style.opacity = '0';

        // Animate to full size
        if (typeof anime !== 'undefined' && typeof anime.animate === 'function') {
            anime.animate(animationElement, {
                left: mainContainerRect.left + 'px',
                top: mainContainerRect.top + 'px',
                width: endWidth + 'px',
                height: endHeight + 'px',
                opacity: 1,
                duration: 400,
                ease: 'inOutQuad',
                onComplete: function() {
                    if (animationElement) {
                        animationElement.remove();
                        animationElement = null;
                    }
                    thumbElement.style.opacity = '';
                    if (callback) callback();
                }
            });
        } else {
            // Web Animations API fallback
            var anim = animationElement.animate([
                { left: thumbRect.left + 'px', top: thumbRect.top + 'px', width: startWidth + 'px', height: startHeight + 'px', opacity: '1' },
                { left: mainContainerRect.left + 'px', top: mainContainerRect.top + 'px', width: endWidth + 'px', height: endHeight + 'px', opacity: '1' }
            ], { duration: 400, easing: 'ease-in-out', fill: 'forwards' });
            anim.finished.then(function() {
                if (animationElement) {
                    animationElement.remove();
                    animationElement = null;
                }
                thumbElement.style.opacity = '';
                if (callback) callback();
            });
        }
    }

    /**
     * Animates from full mainContainer size back to the thumb position in the grid
     * @method animateFullSizeToThumb
     * @param {String} hypervideoID The ID of the hypervideo to animate to
     * @param {Function} callback Function to call after animation completes
     */
    function animateFullSizeToThumb(hypervideoID, capturedVideoContainer, mainContainerRect, callback) {
        // First, ensure overview is visible so thumbs can be positioned
        // Show overview but keep it visually behind the animation (it's already added to DOM)
        domElement.classList.add('active');
        changeViewSize();

        // Function to find thumb and perform animation
        function findThumbAndAnimate() {
            // Find the thumb element (lowercase attribute set by renderThumb)
            var thumbElement = OverviewList.querySelector('.hypervideoThumb[data-hypervideoid="' + hypervideoID + '"]');

            if (!thumbElement) {
                // Thumb not found yet, try again after a short delay
                window.setTimeout(findThumbAndAnimate, 50);
                return;
            }

            // Get thumb position relative to viewport
            var thumbRect = thumbElement.getBoundingClientRect();

            // Check if thumb has valid dimensions and position (not 0x0 and not at 0,0)
            if (thumbRect.width === 0 || thumbRect.height === 0 ||
                (thumbRect.left === 0 && thumbRect.top === 0 && thumbRect.width < 100)) {
                // Thumb not positioned yet, try again
                window.setTimeout(findThumbAndAnimate, 50);
                return;
            }

            // Create animation element - use a simple scalable representation
            var computedStyle = capturedVideoContainer
                ? window.getComputedStyle(capturedVideoContainer)
                : null;

            // Get background color from the video container
            var bgColor = '#000';
            if (computedStyle && computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                bgColor = computedStyle.backgroundColor;
            }

            // Create a simple, scalable div (no nested elements with fixed sizes)
            animationElement = document.createElement('div');
            Object.assign(animationElement.style, {
                position: 'fixed',
                left: mainContainerRect.left + 'px',
                top: mainContainerRect.top + 'px',
                width: mainContainerRect.width + 'px',
                height: mainContainerRect.height + 'px',
                margin: '0',
                padding: '0',
                zIndex: '10000',
                pointerEvents: 'none',
                transformOrigin: 'top left',
                overflow: 'hidden',
                backgroundColor: bgColor,
                border: '2px solid var(--primary-fg-color)',
                transform: 'scale(1)',
                boxSizing: 'border-box',
                opacity: '1'
            });

            document.body.append(animationElement);

            // Animate to thumb position
            if (typeof anime !== 'undefined' && typeof anime.animate === 'function') {
                anime.animate(animationElement, {
                    left: thumbRect.left + 'px',
                    top: thumbRect.top + 'px',
                    width: thumbRect.width + 'px',
                    height: thumbRect.height + 'px',
                    opacity: 1,
                    duration: 400,
                    ease: 'inOutQuad',
                    onComplete: function() {
                        if (animationElement) {
                            animationElement.remove();
                            animationElement = null;
                        }
                        if (callback) callback();
                    }
                });
            } else {
                // Web Animations API fallback
                var anim = animationElement.animate([
                    { left: mainContainerRect.left + 'px', top: mainContainerRect.top + 'px', width: mainContainerRect.width + 'px', height: mainContainerRect.height + 'px', opacity: '1' },
                    { left: thumbRect.left + 'px', top: thumbRect.top + 'px', width: thumbRect.width + 'px', height: thumbRect.height + 'px', opacity: '1' }
                ], { duration: 400, easing: 'ease-in-out', fill: 'forwards' });
                anim.finished.then(function() {
                    if (animationElement) {
                        animationElement.remove();
                        animationElement = null;
                    }
                    if (callback) callback();
                });
            }
        }

        // Wait for overview to be visible and layout to complete
        // Use requestAnimationFrame to ensure DOM is updated, then wait for layout
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                // Start looking for the thumb
                findThumbAndAnimate();
            });
        });
    }

    /**
     * Description
     * @method toggleViewMode
     * @param {} viewMode
     * @param {} oldViewMode
     * @return
     */
    function toggleViewMode(viewMode, oldViewMode) {

        if (viewMode === 'overview') {
            // Animate from video view back to thumb position
            var currentHypervideoID = FrameTrail.module('RouteNavigation').hypervideoID;
            if (oldViewMode === 'video' && currentHypervideoID) {
                // Capture video view immediately and synchronously (before other modules hide it)
                var _t = FrameTrail.getState('target');
                var _targetEl = (typeof _t === 'string') ? document.querySelector(_t) : _t;
                var viewVideo = _targetEl.querySelector('.viewVideo');
                var videoContainer = viewVideo ? viewVideo.querySelector('.videoContainer') : null;
                var mainContainer = _targetEl.querySelector('.mainContainer');
                var mainContainerRect = mainContainer ? mainContainer.getBoundingClientRect() : null;

                // Check if we have a video view to animate from
                if (viewVideo && videoContainer && mainContainerRect) {
                    // Store reference to video container for animation
                    var capturedContainer = videoContainer;

                    // Delay showing overview until animation completes
                    animateFullSizeToThumb(currentHypervideoID, capturedContainer, mainContainerRect, function() {
                        FrameTrail.module('Titlebar').title = labels['GenericOverview'];
                    });
                } else {
                    // Video view not available, just show overview
                    changeViewSize();
                    domElement.classList.add('active');
                    FrameTrail.module('Titlebar').title = labels['GenericOverview'];
                }
            } else {
                changeViewSize();
                domElement.classList.add('active');
                FrameTrail.module('Titlebar').title = labels['GenericOverview'];
            }
        } else if (viewMode === 'video' && oldViewMode === 'overview') {
            // Animate from thumb position to full size when switching from overview to video
            // Check if animation is already in progress
            if (animationElement) {
                // Animation already in progress, just hide overview
                domElement.classList.remove('active');
                return;
            }

            // Use requestAnimationFrame to ensure ViewVideo has processed first, then hide it
            var _t2 = FrameTrail.getState('target');
            var _targetEl2 = (typeof _t2 === 'string') ? document.querySelector(_t2) : _t2;
            var viewVideo2 = _targetEl2.querySelector('.viewVideo');
            requestAnimationFrame(function() {
                // Hide video view after ViewVideo has shown it
                if (viewVideo2) viewVideo2.classList.remove('active');

                // Use the last selected thumb if available (from click), otherwise find active thumb
                var thumbToAnimate = lastSelectedThumb;

                if (!thumbToAnimate) {
                    // Find the active hypervideo thumb
                    var currentHypervideoID = FrameTrail.module('RouteNavigation').hypervideoID;
                    if (currentHypervideoID) {
                        thumbToAnimate = OverviewList.querySelector('.hypervideoThumb.activeHypervideo');
                        if (!thumbToAnimate) {
                            thumbToAnimate = OverviewList.querySelector('.hypervideoThumb[data-hypervideoid="' + currentHypervideoID + '"]');
                        }
                    }
                }

                if (thumbToAnimate) {
                    // Clear the stored thumb
                    lastSelectedThumb = null;

                    // Capture thumb position while overview is still visible
                    var thumbRect = thumbToAnimate.getBoundingClientRect();

                    // Only animate if thumb has valid position (not at 0,0 with tiny size)
                    if (thumbRect.width > 0 && thumbRect.height > 0 &&
                        !(thumbRect.left === 0 && thumbRect.top === 0 && thumbRect.width < 100)) {

                        // Hide overview during animation
                        domElement.classList.remove('active');

                        // Animate thumb to full size, passing the pre-captured rect
                        animateThumbToFullSize(thumbToAnimate, function() {
                            // Animation complete, now show the video view
                            if (viewVideo2) viewVideo2.classList.add('active');
                            // Ensure ViewVideo is properly initialized
                            if (FrameTrail.module('ViewVideo') && FrameTrail.module('ViewVideo').onChange && FrameTrail.module('ViewVideo').onChange.viewMode) {
                                FrameTrail.module('ViewVideo').onChange.viewMode('video');
                            }
                        }, thumbRect);
                    } else {
                        // Thumb position not valid, show video view immediately
                        if (viewVideo2) viewVideo2.classList.add('active');
                        domElement.classList.remove('active');
                    }
                } else {
                    // Thumb not found, show video view immediately
                    if (viewVideo2) viewVideo2.classList.add('active');
                    domElement.classList.remove('active');
                }
            });
        } else if (viewMode != 'resources') {
            domElement.classList.remove('active');
        }

    };


    /**
     * Description
     * @method toggleEditMode
     * @param {} editMode
     * @return
     */
    function toggleEditMode(editMode) {

        if (editMode) {

        } else {

        }

        initList();

    };


    /**
     * Description
     * @method updateUserLogin
     * @return
     */
    function updateUserLogin(){

        initList();

    };


    /**
     * Description
     * @method refreshList
     * @return
     */
    function refreshList(){

        initList();

    };


    return {

        onChange: {
            sidebarOpen:    toggleSidebarOpen,
            viewSize:       changeViewSize,
            fullscreen:     toggleFullscreen,
            viewMode:       toggleViewMode,
            editMode:       toggleEditMode,

            loggedIn:       updateUserLogin
        },

        create:      create,
        refreshList: refreshList

    };

});
