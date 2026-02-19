/**
 * @module Player
 */

/**
 * I am the TimelineController.
 * I manage shared timeline functionality including zoom, scroll synchronization,
 * time ruler, and minimap across all timeline types (overlays, annotations, code snippets).
 *
 * @class TimelineController
 * @static
 */

FrameTrail.defineModule('TimelineController', function(FrameTrail) {

    var labels = FrameTrail.module('Localization').labels;

    // State
    var zoomLevel = 1,
        scrollPosition = 0,
        initialized = false,
        registeredTimelines = [],
        controlsContainer = null,
        timeRulerElement = null,
        minimapElement = null,
        minimapViewport = null,
        playheadElements = [],
        rulerPlayhead = null,
        duration = 0,
        containerWidth = 0,
        isPlaying = false,
        timeUpdateHandler = null;

    // Constants
    var ZOOM_PRESETS = [1, 2, 4, 8];
    var MIN_ZOOM = 1;
    var MAX_ZOOM = 16;


    /**
     * Initialize all edit timelines at once.
     * Called when entering ANY edit mode for the first time.
     * @method initEditTimelines
     */
    function initEditTimelines() {
        if (initialized) return;

        var ViewVideo = FrameTrail.module('ViewVideo');
        duration = FrameTrail.module('HypervideoModel').duration;

        // Register all three timelines
        registerTimeline(ViewVideo.OverlayTimeline);
        registerTimeline(ViewVideo.AnnotationTimeline);
        registerTimeline(ViewVideo.CodeSnippetTimeline);

        // Create shared controls container
        controlsContainer = $('<div class="timelineControlsContainer"></div>');

        // DOM order in playerContainer is:
        //   codeSnippetTimeline > overlayTimeline > playerProgress > controls > annotationTimeline
        // Insert before codeSnippetTimeline so controls appear above all timelines
        ViewVideo.CodeSnippetTimeline.before(controlsContainer);

        // Create UI elements
        createZoomControls();
        createMinimap();
        createTimeRuler();

        // Set initial container width
        if (registeredTimelines.length > 0) {
            containerWidth = registeredTimelines[0].element.width();
        }

        // Register timeupdate listener for playhead sync
        timeUpdateHandler = onTimeUpdate;
        FrameTrail.addEventListener('timeupdate', timeUpdateHandler);

        initialized = true;
    }


    /**
     * Clean up when leaving edit mode entirely.
     * @method destroyEditTimelines
     */
    function destroyEditTimelines() {
        if (!initialized) return;

        // Clean up timelines: remove playheads, unwrap children from scroller back to timeline
        registeredTimelines.forEach(function(t) {
            t.element.off('scroll.timelineSync');
            if (t.playhead) {
                t.playhead.remove();
            }
            if (t.scroller) {
                t.scroller.off('click.timelineSeek');
                t.scroller.children().appendTo(t.element);
                t.scroller.remove();
            }
        });
        registeredTimelines = [];

        // Remove controls
        if (controlsContainer) {
            controlsContainer.remove();
            controlsContainer = null;
        }

        timeRulerElement = null;
        minimapElement = null;
        minimapViewport = null;
        playheadElements = [];
        rulerPlayhead = null;

        // Remove timeupdate listener
        if (timeUpdateHandler) {
            FrameTrail.removeEventListener('timeupdate', timeUpdateHandler);
            timeUpdateHandler = null;
        }

        // Reset state
        zoomLevel = 1;
        scrollPosition = 0;
        initialized = false;
        isPlaying = false;
    }


    /**
     * Handle timeupdate event to sync playhead positions.
     * @method onTimeUpdate
     * @private
     */
    function onTimeUpdate() {
        if (!initialized || registeredTimelines.length === 0 || duration === 0) return;

        var currentTime = FrameTrail.module('HypervideoController').currentTime;
        var scrollerWidth = containerWidth * zoomLevel;
        var playheadPosition = (currentTime / duration) * scrollerWidth;

        // Update playhead positions on all timelines
        playheadElements.forEach(function(playhead) {
            playhead.css('left', playheadPosition + 'px');
        });

        // Update ruler playhead
        if (rulerPlayhead) {
            rulerPlayhead.css('left', playheadPosition + 'px');
        }

        // Auto-scroll to keep playhead visible when zoomed in
        if (zoomLevel > 1) {
            var visibleStart = scrollPosition;
            var visibleEnd = scrollPosition + containerWidth;
            var margin = containerWidth * 0.1;

            if (playheadPosition < visibleStart + margin ||
                playheadPosition > visibleEnd - margin) {
                scrollToTime(currentTime, false);
            }
        }
    }


    /**
     * Register a timeline element to be managed.
     * @method registerTimeline
     * @param {jQuery} timelineElement
     */
    function registerTimeline(timelineElement) {
        // Ensure timeline has scroller wrapper
        var scroller = timelineElement.find('.timelineScroller');
        if (!scroller.length) {
            scroller = $('<div class="timelineScroller"></div>');
            scroller.append(timelineElement.children());
            timelineElement.append(scroller);
        }

        // Add playhead indicator inside scroller (positioned absolutely within it)
        var playhead = $('<div class="timelinePlayhead"></div>');
        scroller.append(playhead);
        playheadElements.push(playhead);

        var timelineData = {
            element: timelineElement,
            scroller: scroller,
            playhead: playhead
        };

        registeredTimelines.push(timelineData);

        // Set up scroll synchronization
        timelineElement.on('scroll.timelineSync', function() {
            if (!timelineElement.data('programmaticScroll')) {
                onTimelineScroll($(this).scrollLeft());
            }
        });

        // Click-to-seek on timeline
        scroller.on('click.timelineSeek', function(e) {
            // Don't seek if clicking on a timelineElement (that has its own interactions)
            if ($(e.target).closest('.timelineElement').length) return;

            var scrollerWidth = scroller.width();
            if (scrollerWidth === 0 || duration === 0) return;

            var rect = scroller[0].getBoundingClientRect();
            var clickX = e.clientX - rect.left;
            var time = (clickX / scrollerWidth) * duration;
            FrameTrail.module('HypervideoController').currentTime = Math.max(0, Math.min(time, duration));
        });

        // Preview popup: move to body on hover to escape overflow clipping.
        // We wrap in a .timelineElement div so existing CSS selectors
        // (body > .timelineElement .previewWrapper) in Annotation/style.css apply.
        function returnPreviewToElement(el) {
            if (el.data('previewDetached')) {
                var wrapper = $('body > .timelineElement.previewPopupWrapper');
                if (wrapper.length) {
                    var preview = wrapper.find('.previewWrapper');
                    preview.css({
                        position: '',
                        top: '',
                        left: '',
                        marginLeft: '',
                        display: '',
                        zIndex: ''
                    }).appendTo(el);
                    wrapper.remove();
                }
                el.removeData('previewDetached');
            }
        }

        timelineElement.on('mouseenter.previewPopup', '.timelineElement', function() {
            var el = $(this);
            var preview = el.find('.previewWrapper');
            if (!preview.length || !preview.children().length) return;

            // Don't show during drag
            if (el.hasClass('ui-draggable-dragging')) return;

            var rect = this.getBoundingClientRect();
            var previewWidth = 80;
            var previewHeight = 60;
            var left = rect.left + (rect.width / 2) - (previewWidth / 2);
            var top = rect.top - previewHeight - 8;

            // Clamp to viewport
            if (left < 4) left = 4;
            if (left + previewWidth > window.innerWidth - 4) left = window.innerWidth - 4 - previewWidth;
            if (top < 4) {
                top = rect.bottom + 8;
            }

            // Create wrapper with .timelineElement class so body > .timelineElement .previewWrapper CSS applies
            var wrapper = $('<div class="timelineElement previewPopupWrapper"></div>').css({
                position: 'fixed',
                top: top + 'px',
                left: left + 'px',
                width: previewWidth + 'px',
                height: previewHeight + 'px',
                zIndex: 200000,
                pointerEvents: 'none'
            });

            preview.css({
                display: 'block',
                position: 'static',
                width: '100%',
                height: '100%',
                left: 'auto',
                top: 'auto',
                marginLeft: '0'
            });

            wrapper.append(preview);
            $('body').append(wrapper);

            el.data('previewDetached', true);
        });

        timelineElement.on('mouseleave.previewPopup', '.timelineElement', function() {
            returnPreviewToElement($(this));
        });

        // Return preview when drag starts
        timelineElement.on('dragstart.previewPopup', '.timelineElement', function() {
            returnPreviewToElement($(this));
        });

        // Apply current zoom
        applyZoomToTimeline(timelineData);
    }


    /**
     * Handle scroll event from any timeline.
     * @method onTimelineScroll
     * @param {Number} newScrollLeft
     */
    function onTimelineScroll(newScrollLeft) {
        scrollPosition = newScrollLeft;

        // Sync other timelines
        registeredTimelines.forEach(function(t) {
            if (t.element.scrollLeft() !== scrollPosition) {
                t.element.data('programmaticScroll', true);
                t.element.scrollLeft(scrollPosition);
                t.element.data('programmaticScroll', false);
            }
        });

        // Sync time ruler
        if (timeRulerElement) {
            timeRulerElement.scrollLeft(scrollPosition);
        }

        updateMinimapViewport();
    }


    /**
     * Apply current scroll position to all timelines.
     * Useful after a timeline becomes visible again.
     * @method syncScroll
     */
    function syncScroll() {
        registeredTimelines.forEach(function(t) {
            t.element.data('programmaticScroll', true);
            t.element.scrollLeft(scrollPosition);
            t.element.data('programmaticScroll', false);
        });

        if (timeRulerElement) {
            timeRulerElement.scrollLeft(scrollPosition);
        }

        updateMinimapViewport();
    }


    /**
     * Set zoom level.
     * @method setZoom
     * @param {Number} level
     * @param {Number} focusTime - Time to keep centered (optional, defaults to playhead)
     */
    function setZoom(level, focusTime) {
        level = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));

        if (level === zoomLevel) return;

        // Default focus to current playhead position
        if (focusTime === undefined) {
            focusTime = FrameTrail.module('HypervideoController').currentTime;
        }

        // Update container width reference
        if (registeredTimelines.length > 0) {
            containerWidth = registeredTimelines[0].element.width();
        }

        // Calculate new scroll position to maintain focus point
        var scrollerWidth = containerWidth * level;
        var focusPixel = (focusTime / duration) * scrollerWidth;
        var newScroll = focusPixel - (containerWidth / 2);

        // Clamp scroll position
        newScroll = Math.max(0, Math.min(newScroll, scrollerWidth - containerWidth));

        zoomLevel = level;

        // Apply to all timelines
        registeredTimelines.forEach(function(t) {
            applyZoomToTimeline(t);
        });

        // Update scroll
        scrollPosition = newScroll;
        syncScroll();

        // Update UI
        updateTimeRuler();
        updateMinimapViewport();
        updateZoomControlsActive();

        // Reposition playheads for new scroller width
        onTimeUpdate();
    }


    /**
     * Apply zoom to a specific timeline.
     * @method applyZoomToTimeline
     * @param {Object} timelineData
     */
    function applyZoomToTimeline(timelineData) {
        var widthPercent = zoomLevel * 100;
        timelineData.scroller.css('width', widthPercent + '%');
    }


    /**
     * Zoom in to next preset level.
     * @method zoomIn
     */
    function zoomIn() {
        var nextPreset = null;
        for (var i = 0; i < ZOOM_PRESETS.length; i++) {
            if (ZOOM_PRESETS[i] > zoomLevel) {
                nextPreset = ZOOM_PRESETS[i];
                break;
            }
        }
        setZoom(nextPreset || Math.min(zoomLevel * 2, MAX_ZOOM));
    }


    /**
     * Zoom out to previous preset level.
     * @method zoomOut
     */
    function zoomOut() {
        var prevPreset = null;
        for (var i = ZOOM_PRESETS.length - 1; i >= 0; i--) {
            if (ZOOM_PRESETS[i] < zoomLevel) {
                prevPreset = ZOOM_PRESETS[i];
                break;
            }
        }
        setZoom(prevPreset || Math.max(zoomLevel / 2, MIN_ZOOM));
    }


    /**
     * Scroll to make a specific time visible.
     * @method scrollToTime
     * @param {Number} time - Time in seconds
     * @param {Boolean} center - If true, center the time
     */
    function scrollToTime(time, center) {
        if (registeredTimelines.length === 0) return;

        containerWidth = registeredTimelines[0].element.width();
        var scrollerWidth = containerWidth * zoomLevel;
        var timePixel = (time / duration) * scrollerWidth;

        if (center) {
            scrollPosition = timePixel - (containerWidth / 2);
        } else {
            // Only scroll if time is outside visible area
            var visibleStart = scrollPosition;
            var visibleEnd = scrollPosition + containerWidth;
            var margin = containerWidth * 0.1;

            if (timePixel < visibleStart + margin) {
                scrollPosition = timePixel - margin;
            } else if (timePixel > visibleEnd - margin) {
                scrollPosition = timePixel - containerWidth + margin;
            } else {
                return; // Already visible
            }
        }

        // Clamp
        var maxScroll = scrollerWidth - containerWidth;
        scrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

        syncScroll();
    }


    /**
     * Create zoom controls UI.
     * @method createZoomControls
     */
    function createZoomControls() {
        var wrapper = $('<div class="timelineZoomControlsWrapper"></div>');
        var controls = $('<div class="timelineZoomControls"></div>');

        ZOOM_PRESETS.forEach(function(preset) {
            var label = preset === 1 ? 'Fit' : preset + 'x';
            var btn = $('<button class="button timelineZoomPreset" data-zoom="' + preset + '">' + label + '</button>');
            if (preset === zoomLevel) btn.addClass('active');
            controls.append(btn);
        });

        controls.on('click', '.timelineZoomPreset', function() {
            var newZoom = parseFloat($(this).attr('data-zoom'));
            setZoom(newZoom);
        });

        wrapper.append(controls);
        controlsContainer.append(wrapper);
    }


    /**
     * Update active state of zoom control buttons.
     * @method updateZoomControlsActive
     */
    function updateZoomControlsActive() {
        if (!controlsContainer) return;

        controlsContainer.find('.timelineZoomPreset').removeClass('active');
        controlsContainer.find('.timelineZoomPreset[data-zoom="' + zoomLevel + '"]').addClass('active');
    }


    /**
     * Create time ruler UI.
     * @method createTimeRuler
     */
    function createTimeRuler() {
        var wrapper = $('<div class="timelineRulerWrapper"></div>');
        timeRulerElement = $('<div class="timelineRuler"><div class="timelineRulerScroller"></div></div>');

        updateTimeRuler();

        // Click to seek
        timeRulerElement.on('click', function(e) {
            var rect = timeRulerElement[0].getBoundingClientRect();
            var clickX = e.clientX - rect.left + timeRulerElement.scrollLeft();
            var scrollerWidth = containerWidth * zoomLevel;
            var time = (clickX / scrollerWidth) * duration;
            FrameTrail.module('HypervideoController').currentTime = Math.max(0, Math.min(time, duration));
        });

        wrapper.append(timeRulerElement);
        controlsContainer.append(wrapper);
    }


    /**
     * Update time ruler markers.
     * @method updateTimeRuler
     */
    function updateTimeRuler() {
        if (!timeRulerElement) return;

        var scroller = timeRulerElement.find('.timelineRulerScroller');
        scroller.empty().css('width', (zoomLevel * 100) + '%');

        var interval = getTimeInterval();

        for (var t = 0; t <= duration; t += interval) {
            var leftPercent = (t / duration) * 100;
            var marker = $('<div class="timelineRulerMarker"></div>')
                .css('left', leftPercent + '%')
                .html('<span class="timelineRulerLabel">' + formatTime(t) + '</span>');
            scroller.append(marker);
        }

        // Re-add playhead indicator to ruler (scroller was emptied above)
        rulerPlayhead = $('<div class="timelinePlayhead"></div>');
        scroller.append(rulerPlayhead);

        // Sync scroll
        timeRulerElement.scrollLeft(scrollPosition);
    }


    /**
     * Get appropriate time interval for ruler based on zoom level.
     * @method getTimeInterval
     * @return {Number}
     */
    function getTimeInterval() {
        if (containerWidth === 0 || duration === 0) return 30;

        var pixelsPerSecond = (containerWidth * zoomLevel) / duration;
        var intervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];

        // Aim for markers roughly every 60-100 pixels
        for (var i = 0; i < intervals.length; i++) {
            if (intervals[i] * pixelsPerSecond >= 60) {
                return intervals[i];
            }
        }
        return intervals[intervals.length - 1];
    }


    /**
     * Format time for display.
     * @method formatTime
     * @param {Number} seconds
     * @return {String}
     */
    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }


    /**
     * Create minimap UI.
     * @method createMinimap
     */
    function createMinimap() {
        var wrapper = $('<div class="timelineMinimapWrapper"></div>');
        minimapElement = $('<div class="timelineMinimap"></div>');
        var track = $('<div class="timelineMinimapTrack"></div>');
        minimapViewport = $('<div class="timelineMinimapViewport"></div>');

        renderMinimapItems(track);

        minimapElement.append(track, minimapViewport);

        // Make viewport draggable
        minimapViewport.draggable({
            axis: 'x',
            containment: 'parent',
            drag: function(event, ui) {
                var parentWidth = minimapElement.width();
                var viewportWidth = minimapViewport.outerWidth();
                var maxLeft = parentWidth - viewportWidth;

                if (maxLeft <= 0) return;

                var scrollPercent = ui.position.left / maxLeft;
                var scrollerWidth = containerWidth * zoomLevel;
                var maxScroll = scrollerWidth - containerWidth;

                scrollPosition = scrollPercent * maxScroll;
                syncScroll();
            }
        });

        // Click on minimap to jump
        minimapElement.on('click', function(e) {
            if ($(e.target).hasClass('timelineMinimapViewport')) return;

            var rect = minimapElement[0].getBoundingClientRect();
            var clickPercent = (e.clientX - rect.left) / rect.width;
            var time = clickPercent * duration;

            FrameTrail.module('HypervideoController').currentTime = time;
            scrollToTime(time, true);
        });

        updateMinimapViewport();

        wrapper.append(minimapElement);
        controlsContainer.append(wrapper);
    }


    /**
     * Render minimap item indicators.
     * @method renderMinimapItems
     * @param {jQuery} track - Optional track element, otherwise finds existing
     */
    function renderMinimapItems(track) {
        if (!track) {
            if (!minimapElement) return;
            track = minimapElement.find('.timelineMinimapTrack');
        }

        track.empty();

        var items = getAllItems();

        items.forEach(function(item) {
            var start = item.data.start;
            var end = item.data.end || (start + 2);
            var leftPercent = (start / duration) * 100;
            var widthPercent = Math.max(((end - start) / duration) * 100, 0.3);

            $('<div class="timelineMinimapItem"></div>').css({
                left: leftPercent + '%',
                width: widthPercent + '%'
            }).appendTo(track);
        });
    }


    /**
     * Get all timeline items for minimap.
     * @method getAllItems
     * @return {Array}
     */
    function getAllItems() {
        var HypervideoModel = FrameTrail.module('HypervideoModel');
        var editMode = FrameTrail.getState('editMode');

        switch (editMode) {
            case 'overlays':
                return HypervideoModel.overlays || [];
            case 'annotations':
                return HypervideoModel.annotations || [];
            case 'codesnippets':
                return HypervideoModel.codeSnippets || [];
            default:
                return [].concat(
                    HypervideoModel.overlays || [],
                    HypervideoModel.annotations || [],
                    HypervideoModel.codeSnippets || []
                );
        }
    }


    /**
     * Update minimap viewport position and size.
     * @method updateMinimapViewport
     */
    function updateMinimapViewport() {
        if (!minimapElement || !minimapViewport) return;

        var minimapWidth = minimapElement.width();

        if (zoomLevel <= 1 || minimapWidth === 0) {
            minimapViewport.css({ width: '100%', left: 0 });
            return;
        }

        var viewportWidthPercent = (1 / zoomLevel) * 100;
        var scrollerWidth = containerWidth * zoomLevel;
        var maxScroll = scrollerWidth - containerWidth;

        var scrollPercent = maxScroll > 0 ? scrollPosition / maxScroll : 0;
        var maxLeft = minimapWidth * (1 - (1 / zoomLevel));
        var viewportLeft = scrollPercent * maxLeft;

        minimapViewport.css({
            width: viewportWidthPercent + '%',
            left: viewportLeft + 'px'
        });
    }


    /**
     * Refresh minimap when items change.
     * @method refreshMinimap
     */
    function refreshMinimap() {
        renderMinimapItems();
    }


    /**
     * Handle window resize.
     * @method onViewSizeChanged
     */
    function onViewSizeChanged() {
        if (!initialized) return;

        if (registeredTimelines.length > 0) {
            containerWidth = registeredTimelines[0].element.width();
        }

        updateTimeRuler();
        updateMinimapViewport();
    }


    // Public interface
    return {

        // Note: init/destroy are called explicitly from ViewVideo.initEditMode()
        // and ViewVideo.leaveEditMode(). No onChange.editMode handler needed
        // (would cause double-destruction).
        onChange: {
            viewSizeChanged: onViewSizeChanged,
            editMode: function() {
                if (initialized) refreshMinimap();
            }
        },

        initEditTimelines:      initEditTimelines,
        destroyEditTimelines:   destroyEditTimelines,

        setZoom:                setZoom,
        zoomIn:                 zoomIn,
        zoomOut:                zoomOut,

        syncScroll:             syncScroll,
        scrollToTime:           scrollToTime,

        refreshMinimap:         refreshMinimap,

        /**
         * @attribute initialized
         * @type Boolean
         * @readOnly
         */
        get initialized()       { return initialized },

        /**
         * @attribute zoomLevel
         * @type Number
         * @readOnly
         */
        get zoomLevel()         { return zoomLevel },

        /**
         * @attribute ZOOM_PRESETS
         * @type Array
         * @readOnly
         */
        get ZOOM_PRESETS()      { return ZOOM_PRESETS }

    };

});
