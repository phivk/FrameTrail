/**
 * @module Shared
 */


/**
 * I am the type definition of a Resource.
 *
 * I am an abstract type, I should not be instantiated directly but rather my sub-types:
 * * {{#crossLink "ResourceImage"}}ResourceImage{{/crossLink}}
 * * {{#crossLink "ResourceLocation"}}ResourceLocation{{/crossLink}}
 * * {{#crossLink "ResourceVideo"}}ResourceVideo{{/crossLink}}
 * * {{#crossLink "ResourceVimeo"}}ResourceVimeo{{/crossLink}}
 * * {{#crossLink "ResourceWebpage"}}ResourceWebpage{{/crossLink}}
 * * {{#crossLink "ResourceWikipedia"}}ResourceWikipedia{{/crossLink}}
 * * {{#crossLink "ResourceYoutube"}}ResourceYoutube{{/crossLink}}
 * * {{#crossLink "ResourceText"}}ResourceText{{/crossLink}}
 *
 * @class Resource
 * @category TypeDefinition
 * @abstract
 */



FrameTrail.defineType(

    'Resource',

    function (FrameTrail) {
        return {
            constructor: function(resourceData){
                this.labels = FrameTrail.module('Localization').labels;
            },
            prototype: {

                /**
                 * I create a preview dialog, call the .renderContent method of a given resource
                 * (e.g. {{#crossLink "ResourceImage/renderContent:method"}}ResourceImage/renderContent{{/crossLink}})
                 * and append the returned element to the dialog.
                 *
                 * @method openPreview
                 * @param {HTMLElement} elementOrigin
                 */
                openPreview: function(elementOrigin) {

                    var animationDiv = elementOrigin.clone(),
                        originOffset = elementOrigin.offset(),
                        finalTop = ($(window).height()/2) - 240,
                        finalLeft = ($(window).width()/2) - 440,
                        self = this;

                    animationDiv.addClass('resourceAnimationDiv').css({
                        position: 'absolute',
                        top: originOffset.top + 'px',
                        left: originOffset.left + 'px',
                        width: elementOrigin.width(),
                        height: elementOrigin.height(),
                        zIndex: 101
                    }).appendTo('body');

                    animationDiv.animate({
                        top: finalTop + 'px',
                        left: finalLeft + 'px',
                        width: 880 + 'px',
                        height: 480 + 'px'
                    }, 300, function() {
                        var previewContent = $('<div class="resourcePreviewDialog"></div>')
                            .append(self.renderContent());

                        var previewDialogCtrl = Dialog({
                            title:     (self.resourceData.type == 'text') ? '' : self.resourceData.name,
                            content:   previewContent,
                            resizable: false,
                            width:     880,
                            height:    480,
                            modal:     true,
                            close: function() {

                                try {
                                    if (TogetherJS && TogetherJS.running) {
                                        var elementFinder = TogetherJS.require("elementFinder");
                                        var location = elementFinder.elementLocation($(this)[0]);
                                        TogetherJS.send({
                                            type: "simulate-dialog-close",
                                            element: location
                                        });
                                    }
                                } catch (e) {}

                                previewDialogCtrl.destroy();
                                animationDiv.animate({
                                    top: originOffset.top + 'px',
                                    left: originOffset.left + 'px',
                                    width: elementOrigin.width(),
                                    height: elementOrigin.height()
                                }, 300, function() {
                                    $('.resourceAnimationDiv').remove();
                                });
                            },
                            open: function() {
                                if ($(this).find('.resourceDetail').data().map) {
                                    $(this).find('.resourceDetail').data().map.invalidateSize();
                                }
                            }
                        });
                    });

                },


                /**
                 * When an {{#crossLink "Overlay/gotInFocus:method"}}Overlay got into Focus{{/crossLink}}, its properties and some additional controls to edit the overlay's attributes
                 * should be shown in the right window of the player.
                 *
                 * I provide a basic method, which can be extended by my sub-types.
                 *
                 * I render properities controls for the UI for the overlay's following attributes:
                 *
                 * * overlay.data.start
                 * * overlay.data.end
                 * * overlay.data.position.top
                 * * overlay.data.position.left
                 * * overlay.data.position.width
                 * * overlay.data.position.height
                 *
                 * __Why__ is this function a method of Resource and not Overlay? --> Because there is only one type of Overlay, but this can hold in its resourceData attribute different types of Resources.
                 * And because the properties controls can depend on resourceData, the method is placed here and in the sub-types of Resource.
                 *
                 * @method renderBasicPropertiesControls
                 * @param {Overlay} overlay
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function, changeDimensions: Function &#125;
                 */
                renderBasicPropertiesControls: function(overlay) {

                    var self = this,
                        controlsContainer = $('<div class="controlsWrapper"></div>'),
                        manualInputMode   = true,
                        defaultControls   = $('<div class="timeControls">'
                        					+ '    <div class="propertiesTypeIcon" data-type="' + overlay.data.type + '"><span class="icon-doc-inv"></span></div>'
                                            + '    <button class="deleteOverlay"><span class="icon-trash"></span></button>'
                                            + '    <label for="TimeStart">'+ this.labels['SettingsTimeStart'] +'</label>'
                                            + '    <input id="TimeStart" type="number" min="0" step="0.1" value="' + overlay.data.start + '" data-tooltip-bottom-right="'+ this.labels['SettingsTimeStart'] +'">'
                                            + '    <label for="TimeEnd">'+ this.labels['SettingsTimeEnd'] +'</label>'
                                            + '    <input id="TimeEnd" type="number" min="0" step="0.1" value="' + overlay.data.end + '">'
                                            + '</div>'
                                            + '<div class="positionControls">'
                                            + '    <label for="PositionHeight">'+ this.labels['SettingsPositionHeight'] +'</label>'
                                            + '    <input id="PositionHeight" class="positionHeight" type="number" step="0.1" value="' + overlay.data.position.height + '">'
                                            + '    <label for="PositionWidth">'+ this.labels['SettingsPositionWidth'] +'</label>'
                                            + '    <input id="PositionWidth" class="positionWidth" type="number" step="0.1" value="' + overlay.data.position.width + '">'
                                            + '    <label for="PositionLeft">'+ this.labels['SettingsPositionLeft'] +'</label>'
                                            + '    <input id="PositionLeft" class="positionLeft" type="number" step="0.1" value="' + overlay.data.position.left + '">'
                                            + '    <label for="PositionTop">'+ this.labels['SettingsPositionTop'] +'</label>'
                                            + '    <input id="PositionTop" class="positionTop" type="number" step="0.1" value="' + overlay.data.position.top + '">'
                                            + '</div>'
                                            + '<div class="overlayOptionsWrapper">'
                                            + '    <div class="overlayOptionsTabs">'
                                            + '        <ul>'
                                            + '            <li><a href="#OverlayOptions">'+ this.labels['GenericOptions'] +'</a></li>'
                                            + '            <li class="ui-tabs-right"><a href="#ActionOnEnd">onEnd</a></li>'
                                            + '            <li class="ui-tabs-right"><a href="#ActionOnStart">onStart</a></li>'
                                            + '            <li class="ui-tabs-right"><a href="#ActionOnClick">onClick</a></li>'
                                            + '            <li class="ui-tabs-right"><a href="#ActionOnReady">onReady</a></li>'
                                            + '            <li class="ui-tabs-right tab-label">'+ this.labels['SettingsActions'] +': </li>'
                                            + '        </ul>'
                                            + '        <div id="OverlayOptions">'
                                            + '            <hr class="overlayAppearanceSeparator">'
                                            + '            <div class="layoutRow">'
                                            + '                <div class="column-4">'
                                            + '                    <label>'+ this.labels['SettingsOpacity'] +'</label>'
                                            + '                    <input type="range" class="opacityRange" min="0" max="1" step="0.01" value="'+ (overlay.data.attributes.opacity || 1) +'">'
                                            + '                </div>'
                                            + '            </div>'
                                            + '            <hr>'
                                            + '            <div class="layoutRow">'
                                            + '                <div class="column-4">'
                                            + '                    <label>'+ this.labels['SettingsAnimationIn'] +'</label>'
                                            + '                    <div class="custom-select">'
                                            + '                    <select class="animationInSelect">'
                                            + '                        <option value="none">'+ this.labels['AnimationNone'] +'</option>'
                                            + '                        <option value="fade">'+ this.labels['AnimationFade'] +'</option>'
                                            + '                        <option value="slideLeft">'+ this.labels['AnimationSlideLeft'] +'</option>'
                                            + '                        <option value="slideRight">'+ this.labels['AnimationSlideRight'] +'</option>'
                                            + '                        <option value="slideUp">'+ this.labels['AnimationSlideUp'] +'</option>'
                                            + '                        <option value="slideDown">'+ this.labels['AnimationSlideDown'] +'</option>'
                                            + '                        <option value="zoom">'+ this.labels['AnimationZoom'] +'</option>'
                                            + '                    </select>'
                                            + '                    </div>'
                                            + '                </div>'
                                            + '                <div class="column-4">'
                                            + '                    <label>'+ this.labels['SettingsAnimationOut'] +'</label>'
                                            + '                    <div class="custom-select">'
                                            + '                    <select class="animationOutSelect">'
                                            + '                        <option value="none">'+ this.labels['AnimationNone'] +'</option>'
                                            + '                        <option value="fade">'+ this.labels['AnimationFade'] +'</option>'
                                            + '                        <option value="slideLeft">'+ this.labels['AnimationSlideLeft'] +'</option>'
                                            + '                        <option value="slideRight">'+ this.labels['AnimationSlideRight'] +'</option>'
                                            + '                        <option value="slideUp">'+ this.labels['AnimationSlideUp'] +'</option>'
                                            + '                        <option value="slideDown">'+ this.labels['AnimationSlideDown'] +'</option>'
                                            + '                        <option value="zoom">'+ this.labels['AnimationZoom'] +'</option>'
                                            + '                    </select>'
                                            + '                    </div>'
                                            + '                </div>'
                                            + '                <div class="column-4">'
                                            + '                    <label>'+ this.labels['SettingsAnimationDuration'] +'</label>'
                                            + '                    <input type="range" class="animationDurationRange" min="100" max="1000" step="50" value="'+ (overlay.data.attributes.animationDuration || 300) +'">'
                                            + '                </div>'
                                            + '            </div>'
                                            + '        </div>'
                                            + '        <div id="ActionOnReady">'
                                            + '            <textarea class="onReadyAction codeTextarea" data-eventname="onReady">' + (overlay.data.events.onReady ? overlay.data.events.onReady : '') + '</textarea>'
                                            + '            <button class="executeActionCode">'+ this.labels['SettingsTestCode'] +'</button>'
                                            + '            <div class="message active">'+ this.labels['MessageTestCode'] +'</div>'
                                            + '        </div>'
                                            + '        <div id="ActionOnClick">'
                                            + '            <textarea class="onClickAction codeTextarea" data-eventname="onClick">' + (overlay.data.events.onClick ? overlay.data.events.onClick : '') + '</textarea>'
                                            + '            <button class="executeActionCode">'+ this.labels['SettingsTestCode'] +'</button>'
                                            + '            <div class="message active">'+ this.labels['MessageTestCode'] +'</div>'
                                            + '        </div>'
                                            + '        <div id="ActionOnStart">'
                                            + '            <textarea class="onStartAction codeTextarea" data-eventname="onStart">' + (overlay.data.events.onStart ? overlay.data.events.onStart : '') + '</textarea>'
                                            + '            <button class="executeActionCode">'+ this.labels['SettingsTestCode'] +'</button>'
                                            + '            <div class="message active">'+ this.labels['MessageTestCode'] +'</div>'
                                            + '        </div>'
                                            + '        <div id="ActionOnEnd">'
                                            + '            <textarea class="onEndAction codeTextarea" data-eventname="onEnd">' + (overlay.data.events.onEnd ? overlay.data.events.onEnd : '') + '</textarea>'
                                            + '            <button class="executeActionCode">'+ this.labels['SettingsTestCode'] +'</button>'
                                            + '            <div class="message active">'+ this.labels['MessageTestCode'] +'</div>'
                                            + '        </div>'
                                            + '    </div>'
                                            + '</div>');

                    controlsContainer.append(defaultControls);

                    controlsContainer.find('.overlayOptionsTabs').tabs({
                        heightStyle: 'fill',
                        activate: function(event, ui) {
                            controlsContainer.find('.overlayOptionsTabs').tabs('refresh');
                            var cm6Wrapper = ui.newPanel.find('.cm6-wrapper')[0];
                            if (cm6Wrapper && cm6Wrapper._cm6view) { cm6Wrapper._cm6view.requestMeasure(); }
                        }
                    });

                    var oldOverlayData;

                    (function() {
                        var $ts = controlsContainer.find('#TimeStart');
                        $ts.attr('max', FrameTrail.module('HypervideoModel').duration);
                        $ts.parent().attr('data-input-id', $ts.attr('id'));
                        oldOverlayData = jQuery.extend({}, overlay.data);
                        $ts.on('input', function(evt) {
                            if(manualInputMode){
                                overlay.data.start = parseFloat(this.value);
                                overlay.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = overlay.data.start;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'start', oldValue: oldOverlayData.start, newValue: overlay.data.start }]
                                });
                            }
                        });
                        $ts.on('change', function(evt) {
                            if(manualInputMode){
                                overlay.data.start = parseFloat($(evt.target).val());
                                overlay.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = overlay.data.start;
                                FrameTrail.module('OverlaysController').stackTimelineView();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'start', oldValue: oldOverlayData.start, newValue: overlay.data.start }]
                                });
                            }
                        });
                    }());

                    (function() {
                        var $te = controlsContainer.find('#TimeEnd');
                        $te.attr('max', FrameTrail.module('HypervideoModel').duration);
                        $te.parent().attr('data-input-id', $te.attr('id'));
                        $te.on('input', function(evt) {
                            if(manualInputMode){
                                overlay.data.end = parseFloat(this.value);
                                overlay.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = overlay.data.end;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'end', oldValue: oldOverlayData.end, newValue: overlay.data.end }]
                                });
                            }
                        });
                        $te.on('change', function(evt) {
                            if(manualInputMode){
                                overlay.data.end = parseFloat($(evt.target).val());
                                overlay.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = overlay.data.end;
                                FrameTrail.module('OverlaysController').stackTimelineView();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'end', oldValue: oldOverlayData.end, newValue: overlay.data.end }]
                                });
                            }
                        });
                    }());

                    // Add undo support for time spinners
                    var timeBeforeEdit = {};
                    controlsContainer.find('#TimeStart, #TimeEnd').on('focus', function() {
                        timeBeforeEdit = {
                            start: overlay.data.start,
                            end: overlay.data.end
                        };
                    }).on('blur', function() {
                        if (timeBeforeEdit.start !== overlay.data.start ||
                            timeBeforeEdit.end !== overlay.data.end) {
                            (function(overlayId, oldTime, newTime, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) {
                                            return overlays[i];
                                        }
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' Time',
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.start = oldTime.start;
                                        o.data.end = oldTime.end;
                                        o.updateTimelineElement();
                                        FrameTrail.module('OverlaysController').stackTimelineView();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.start = newTime.start;
                                        o.data.end = newTime.end;
                                        o.updateTimelineElement();
                                        FrameTrail.module('OverlaysController').stackTimelineView();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, 
                               JSON.parse(JSON.stringify(timeBeforeEdit)), 
                               { start: overlay.data.start, end: overlay.data.end }, 
                               self.labels);
                        }
                    });

                    function bindPositionInput(selector, prop, inputId) {
                        var $elem = controlsContainer.find(selector);
                        $elem.parent().attr('data-input-id', inputId);
                        $elem.on('input', function(evt) {
                            if (manualInputMode) {
                                overlay.data.position[prop] = parseFloat(this.value);
                                overlay.updateOverlayElement();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'position.' + prop, oldValue: oldOverlayData.position[prop], newValue: overlay.data.position[prop] }]
                                });
                            }
                        });
                        $elem.on('change', function(evt) {
                            if (manualInputMode) {
                                overlay.data.position[prop] = parseFloat($(evt.target).val());
                                overlay.updateOverlayElement();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'OverlayChange',
                                    overlay: overlay.data,
                                    changes: [{ property: 'position.' + prop, oldValue: oldOverlayData.position[prop], newValue: overlay.data.position[prop] }]
                                });
                            }
                        });
                    }

                    oldOverlayData = jQuery.extend({}, overlay.data);
                    bindPositionInput('.positionTop',    'top',    'PositionTop');
                    bindPositionInput('.positionLeft',   'left',   'PositionLeft');
                    bindPositionInput('.positionWidth',  'width',  'PositionWidth');
                    bindPositionInput('.positionHeight', 'height', 'PositionHeight');

                    // Add undo support for position spinners
                    var positionBeforeEdit = {};
                    controlsContainer.find('.positionTop, .positionLeft, .positionWidth, .positionHeight').on('focus', function() {
                        positionBeforeEdit = {
                            top: overlay.data.position.top,
                            left: overlay.data.position.left,
                            width: overlay.data.position.width,
                            height: overlay.data.position.height
                        };
                    }).on('blur', function() {
                        var currentPosition = overlay.data.position;
                        if (positionBeforeEdit.top !== currentPosition.top ||
                            positionBeforeEdit.left !== currentPosition.left ||
                            positionBeforeEdit.width !== currentPosition.width ||
                            positionBeforeEdit.height !== currentPosition.height) {
                            (function(overlayId, oldPos, newPos, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) {
                                            return overlays[i];
                                        }
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' Position',
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.position.top = oldPos.top;
                                        o.data.position.left = oldPos.left;
                                        o.data.position.width = oldPos.width;
                                        o.data.position.height = oldPos.height;
                                        o.updateOverlayElement();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.position.top = newPos.top;
                                        o.data.position.left = newPos.left;
                                        o.data.position.width = newPos.width;
                                        o.data.position.height = newPos.height;
                                        o.updateOverlayElement();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, 
                               JSON.parse(JSON.stringify(positionBeforeEdit)), 
                               JSON.parse(JSON.stringify(currentPosition)), 
                               self.labels);
                        }
                    });

                    if ($.isArray(overlay.data.attributes) && overlay.data.attributes.length < 1) {
                        overlay.data.attributes = {};
                    }

                    // Helper to sync appearance UI controls from current data
                    var syncAppearanceUI = function(a) {
                        var c = $('#OverlayAppearance');
                        if (!c.length) return;
                        c.find('.opacityRange').val(a.opacity || 1);
                        c.find('.animationInSelect').val(a.animationIn || 'none');
                        c.find('.animationOutSelect').val(a.animationOut || 'none');
                        c.find('.animationDurationRange').val(a.animationDuration || 300);
                    };

                    // --- Opacity Range ---
                    var opacityBeforeChange = overlay.data.attributes.opacity || 1;
                    controlsContainer.find('.opacityRange').on('focus', function() {
                        opacityBeforeChange = overlay.data.attributes.opacity || 1;
                    });
                    controlsContainer.find('.opacityRange').on('input', function() {
                        overlay.data.attributes.opacity = parseFloat(this.value);
                        overlay.updateOverlayElement();
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                    });
                    controlsContainer.find('.opacityRange').on('change', function() {
                        var newOpacity = parseFloat(this.value);
                        if (opacityBeforeChange !== newOpacity) {
                            (function(overlayId, oldOpacity, newOp, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) return overlays[i];
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' ' + labels['SettingsOpacity'],
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.opacity = oldOpacity;
                                        o.updateOverlayElement();
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.opacity = newOp;
                                        o.updateOverlayElement();
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, opacityBeforeChange, newOpacity, self.labels);
                        }
                        opacityBeforeChange = newOpacity;
                    });

                    // ==========================================
                    // ANIMATION CONTROLS
                    // ==========================================

                    controlsContainer.find('.animationInSelect').val(overlay.data.attributes.animationIn || 'none');
                    controlsContainer.find('.animationOutSelect').val(overlay.data.attributes.animationOut || 'none');

                    // --- Animation In Select ---
                    var animInBeforeChange = overlay.data.attributes.animationIn || 'none';
                    controlsContainer.find('.animationInSelect').on('focus', function() {
                        animInBeforeChange = overlay.data.attributes.animationIn || 'none';
                    });
                    controlsContainer.find('.animationInSelect').on('change', function() {
                        var newValue = $(this).val();
                        var oldValue = animInBeforeChange;
                        overlay.data.attributes.animationIn = newValue;
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');

                        if (oldValue !== newValue) {
                            (function(overlayId, oldVal, newVal, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) return overlays[i];
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' ' + labels['SettingsAnimationIn'],
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationIn = oldVal;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationIn = newVal;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, oldValue, newValue, self.labels);
                        }
                        animInBeforeChange = newValue;
                    });

                    // --- Animation Out Select ---
                    var animOutBeforeChange = overlay.data.attributes.animationOut || 'none';
                    controlsContainer.find('.animationOutSelect').on('focus', function() {
                        animOutBeforeChange = overlay.data.attributes.animationOut || 'none';
                    });
                    controlsContainer.find('.animationOutSelect').on('change', function() {
                        var newValue = $(this).val();
                        var oldValue = animOutBeforeChange;
                        overlay.data.attributes.animationOut = newValue;
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');

                        if (oldValue !== newValue) {
                            (function(overlayId, oldVal, newVal, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) return overlays[i];
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' ' + labels['SettingsAnimationOut'],
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationOut = oldVal;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationOut = newVal;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, oldValue, newValue, self.labels);
                        }
                        animOutBeforeChange = newValue;
                    });

                    // --- Animation Duration Range ---
                    var durationBeforeChange = overlay.data.attributes.animationDuration || 300;
                    controlsContainer.find('.animationDurationRange').on('focus', function() {
                        durationBeforeChange = overlay.data.attributes.animationDuration || 300;
                    });
                    controlsContainer.find('.animationDurationRange').on('input', function() {
                        overlay.data.attributes.animationDuration = parseInt(this.value, 10);
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                    });
                    controlsContainer.find('.animationDurationRange').on('change', function() {
                        var newDuration = parseInt(this.value, 10);
                        if (durationBeforeChange !== newDuration) {
                            (function(overlayId, oldDuration, newDur, labels) {
                                var findOverlay = function() {
                                    var overlays = FrameTrail.module('HypervideoModel').overlays;
                                    for (var i = 0; i < overlays.length; i++) {
                                        if (overlays[i].data.created === overlayId) return overlays[i];
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'overlays',
                                    description: labels['SidebarOverlays'] + ' ' + labels['SettingsAnimationDuration'],
                                    undo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationDuration = oldDuration;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    },
                                    redo: function() {
                                        var o = findOverlay();
                                        if (!o) return;
                                        o.data.attributes.animationDuration = newDur;
                                        syncAppearanceUI(o.data.attributes);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                    }
                                });
                            })(overlay.data.created, durationBeforeChange, newDuration, self.labels);
                        }
                        durationBeforeChange = newDuration;
                    });

                    controlsContainer.find('.arrangeTop').click( function() {
                        // Move to top
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                    });

                    controlsContainer.find('.arrangeBottom').click( function() {
                        // Move to bottom
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                    });

                    controlsContainer.find('.deleteOverlay').click(function(){

                        FrameTrail.module('OverlaysController').deleteOverlay(overlay);

                    });

                    // Init CodeMirror 6 editors for Actions / Events
                    var CM6 = window.FrameTrailCM6;
                    var codeTextareas = controlsContainer.find('.codeTextarea');

                    for (var i=0; i<codeTextareas.length; i++) {
                        (function(textarea) {
                            var eventName = textarea.data('eventname');
                            var eventCodeBeforeEdit = null;
                            var eventCodeChanged = false;

                            var cm6Wrapper = $('<div class="cm6-wrapper" style="height: calc(100% - 40px);"></div>');
                            textarea.after(cm6Wrapper).hide();

                            new CM6.EditorView({
                                state: CM6.EditorState.create({
                                    doc: textarea.val(),
                                    extensions: [
                                        CM6.oneDark,
                                        CM6.lineNumbers(),
                                        CM6.highlightActiveLine(),
                                        CM6.highlightActiveLineGutter(),
                                        CM6.drawSelection(),
                                        CM6.history(),
                                        CM6.keymap.of([].concat(CM6.defaultKeymap, CM6.historyKeymap)),
                                        CM6.EditorView.lineWrapping,
                                        CM6.StreamLanguage.define(CM6.legacyModes.javascript),
                                        window.FrameTrailCM6Linters.js,
                                        CM6.lintGutter(),
                                        CM6.EditorView.domEventHandlers({
                                            focus: function() {
                                                eventCodeBeforeEdit = overlay.data.events[eventName] || '';
                                                eventCodeChanged = false;
                                            },
                                            blur: function(evt, view) {
                                                var newValue = view.state.doc.toString();
                                                if (eventCodeChanged && eventCodeBeforeEdit !== newValue) {
                                                    (function(overlayId, evtName, oldCode, newCode, labels) {
                                                        var findOverlay = function() {
                                                            var overlays = FrameTrail.module('HypervideoModel').overlays;
                                                            for (var j = 0; j < overlays.length; j++) {
                                                                if (overlays[j].data.created === overlayId) { return overlays[j]; }
                                                            }
                                                            return null;
                                                        };
                                                        FrameTrail.module('UndoManager').register({
                                                            category: 'overlays',
                                                            description: labels['SidebarOverlays'] + ' ' + labels['SettingsActions'],
                                                            undo: function() {
                                                                var o = findOverlay();
                                                                if (!o) return;
                                                                o.data.events[evtName] = oldCode;
                                                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                                            },
                                                            redo: function() {
                                                                var o = findOverlay();
                                                                if (!o) return;
                                                                o.data.events[evtName] = newCode;
                                                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                                            }
                                                        });
                                                    })(overlay.data.created, eventName, eventCodeBeforeEdit, newValue, self.labels);
                                                }
                                                eventCodeBeforeEdit = null;
                                                eventCodeChanged = false;
                                            }
                                        }),
                                        CM6.EditorView.updateListener.of(function(update) {
                                            if (!update.docChanged) { return; }
                                            var newValue = update.state.doc.toString();
                                            overlay.data.events[eventName] = newValue;
                                            eventCodeChanged = true;
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                        })
                                    ]
                                }),
                                parent: cm6Wrapper[0]
                            });
                        })(codeTextareas.eq(i));
                    }

                    controlsContainer.find('.executeActionCode').click(function(evt) {
                        var textarea = $(evt.currentTarget).siblings('textarea');
                        try {
                            var testRun = new Function('FrameTrail', textarea.val());
                                testRun.call(overlay, FrameTrail);
                        } catch (exception) {
                            alert('Code contains errors: '+ exception.message);
                        }
                    });


                    var PropertiesControlsInterface = {

                        controlsContainer: controlsContainer,

                        changeStart:  function(val) {
                            manualInputMode = false;
                            controlsContainer.find('#TimeStart').val(val);
                            manualInputMode = true;
                        },

                        changeEnd: function(val) {
                            manualInputMode = false;
                            controlsContainer.find('#TimeEnd').val(val);
                            manualInputMode = true;
                        },

                        changeDimensions: function(val) {
                            manualInputMode = false;
                            controlsContainer.find('.positionTop').val(val.top);
                            controlsContainer.find('.positionLeft').val(val.left);
                            controlsContainer.find('.positionWidth').val(val.width);
                            controlsContainer.find('.positionHeight').val(val.height);
                            manualInputMode = true;
                        }

                    }




                    return PropertiesControlsInterface;

                },

                /**
                 * When an {{#crossLink "Annotation/gotInFocus:method"}}Annotation got into Focus{{/crossLink}}, its properties and some additional controls attributes
                 * should be shown in the right window of the player.
                 *
                 * I provide a basic method, which can be extended by my sub-types.
                 *
                 * I render properities controls for the UI for the annotations's following attributes:
                 *
                 * * annotation.data.start
                 * * annotation.data.end
                 *
                 * __Why__ is this function a method of Resource and not Annotation? --> Because there is only one type of Annotation, but this can hold in its resourceData attribute different types of Resources.
                 * And because the properties controls can depend on resourceData, the method is placed here and in the sub-types of Resource.
                 *
                 * @method renderBasicTimeControls
                 * @param {Annotation} annotation
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function &#125;
                 */
                renderBasicTimeControls: function(annotation) {

                    var self = this,
                        controlsContainer = $('<div class="controlsWrapper"></div>'),
                        manualInputMode   = true,
                        defaultControls   = $('<div class="timeControls">'
                                            + '    <div class="propertiesTypeIcon" data-type="' + annotation.data.type + '"><span class="icon-doc-inv"></span></div>'
                                            + '    <button class="deleteAnnotation"><span class="icon-trash"></span></button>'
                                            + '    <label for="TimeStart">'+ this.labels['SettingsTimeStart'] +'</label>'
                                            + '    <input id="TimeStart" type="number" min="0" step="0.1" value="' + annotation.data.start + '">'
                                            + '    <label for="TimeEnd">'+ this.labels['SettingsTimeEnd'] +'</label>'
                                            + '    <input id="TimeEnd" type="number" min="0" step="0.1" value="' + annotation.data.end + '">'
                                            + '</div>'),
                        thumbContainer    = $('<div class="previewThumbContainer"></div>');

                    var annotationOptions = $('<div class="annotationOptionsWrapper">'
                                            + '    <div class="annotationOptionsTabs">'
                                            + '        <ul>'
                                            + '            <li><a href="#AnnotationOptions">'+ this.labels['GenericOptions'] +'</a></li>'
                                            + '            <li><a href="#TagOptions">'+ this.labels['GenericTags'] +'</a></li>'
                                            + '        </ul>'
                                            + '        <div id="AnnotationOptions"></div>'
                                            + '        <div id="TagOptions">'
                                            + '            <label>'+ this.labels['SettingsManageTags'] +':</label>'
                                            + '            <div class="existingTags"></div>'
                                            + '            <div class="button small contextSelectButton newTagButton">'
                                            + '                <span class="icon-plus">'+ this.labels['GenericAdd'] +'</span>'
                                            + '                <div class="contextSelectList"></div>'
                                            + '            </div>'
                                            + '        </div>'
                                            + '    </div>'
                                            + '</div>');

                    thumbContainer.append(annotation.resourceItem.renderThumb());

                    controlsContainer.append(defaultControls, thumbContainer, annotationOptions);

                    controlsContainer.find('.annotationOptionsTabs').tabs({
                        heightStyle: 'fill',
                        activate: function(event, ui) {
                            controlsContainer.find('.annotationOptionsTabs').tabs('refresh');
                            var cm6Wrapper = ui.newPanel.find('.cm6-wrapper')[0];
                            if (cm6Wrapper && cm6Wrapper._cm6view) { cm6Wrapper._cm6view.requestMeasure(); }
                        }
                    });

                    // Tag Management

                    var tagManagementUI = annotationOptions.find('#TagOptions');

                    updateExistingTags();

                    tagManagementUI.find('.newTagButton').click(function() {
                        tagManagementUI.find('.contextSelectButton').not($(this)).removeClass('active');

                        updateTagSelectContainer();
                        $(this).toggleClass('active');
                    });

                    function updateExistingTags() {
                        tagManagementUI.find('.existingTags').empty();

                        for (var i=0; i<annotation.data.tags.length; i++) {

                            var tagLabel = FrameTrail.module('TagModel').getTagLabelAndDescription(annotation.data.tags[i], 'de').label,
                                tagItem = $('<div class="tagItem" data-tag="'+ annotation.data.tags[i] +'">'+ tagLabel +'</div>');
                            var deleteButton = $('<div class="deleteItem"><span class="icon-cancel"></span></div>')
                            deleteButton.click(function() {

                                // Delete tag
                                var tagToRemove = $(this).parent().attr('data-tag');
                                annotation.data.tags.splice(annotation.data.tags.indexOf(tagToRemove), 1);
                                updateExistingTags();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');

                                FrameTrail.module('ViewLayout').updateManagedContent();
                                FrameTrail.module('ViewLayout').updateContentInContentViews();

                                // Register undo for tag removal
                                (function(annotationId, removedTag, labels) {
                                    var findAnnotation = function() {
                                        var annotations = FrameTrail.module('HypervideoModel').annotations;
                                        for (var i = 0; i < annotations.length; i++) {
                                            if (annotations[i].data.created === annotationId) {
                                                return annotations[i];
                                            }
                                        }
                                        return null;
                                    };
                                    FrameTrail.module('UndoManager').register({
                                        category: 'annotations',
                                        description: labels['SidebarMyAnnotations'] + ' Tag',
                                        undo: function() {
                                            var a = findAnnotation();
                                            if (!a) return;
                                            a.data.tags.push(removedTag);
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                            FrameTrail.module('ViewLayout').updateManagedContent();
                                            FrameTrail.module('ViewLayout').updateContentInContentViews();
                                        },
                                        redo: function() {
                                            var a = findAnnotation();
                                            if (!a) return;
                                            var idx = a.data.tags.indexOf(removedTag);
                                            if (idx !== -1) a.data.tags.splice(idx, 1);
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                            FrameTrail.module('ViewLayout').updateManagedContent();
                                            FrameTrail.module('ViewLayout').updateContentInContentViews();
                                        }
                                    });
                                })(annotation.data.created, tagToRemove, self.labels);

                            });
                            tagItem.append(deleteButton);
                            tagManagementUI.find('.existingTags').append(tagItem);

                        }
                    }

                    function updateTagSelectContainer() {

                        tagManagementUI.find('.newTagButton .contextSelectList').empty();

                        var allTags = FrameTrail.module('TagModel').getAllTagLabelsAndDescriptions('de');
                        for (var tagID in allTags) {
                            if ( annotation.data.tags.indexOf(tagID) != -1 ) {
                                continue;
                            }
                            var tagLabel = allTags[tagID].label,
                                tagItem = $('<div class="tagItem" data-tag="'+ tagID +'">'+ tagLabel +'</div>');
                            tagItem.click(function() {

                                // Add tag
                                var tagToAdd = $(this).attr('data-tag');
                                annotation.data.tags.push(tagToAdd);
                                updateExistingTags();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');

                                FrameTrail.module('ViewLayout').updateManagedContent();
                                FrameTrail.module('ViewLayout').updateContentInContentViews();

                                // Register undo for tag addition
                                (function(annotationId, addedTag, labels) {
                                    var findAnnotation = function() {
                                        var annotations = FrameTrail.module('HypervideoModel').annotations;
                                        for (var i = 0; i < annotations.length; i++) {
                                            if (annotations[i].data.created === annotationId) {
                                                return annotations[i];
                                            }
                                        }
                                        return null;
                                    };
                                    FrameTrail.module('UndoManager').register({
                                        category: 'annotations',
                                        description: labels['SidebarMyAnnotations'] + ' Tag',
                                        undo: function() {
                                            var a = findAnnotation();
                                            if (!a) return;
                                            var idx = a.data.tags.indexOf(addedTag);
                                            if (idx !== -1) a.data.tags.splice(idx, 1);
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                            FrameTrail.module('ViewLayout').updateManagedContent();
                                            FrameTrail.module('ViewLayout').updateContentInContentViews();
                                        },
                                        redo: function() {
                                            var a = findAnnotation();
                                            if (!a) return;
                                            a.data.tags.push(addedTag);
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                            FrameTrail.module('ViewLayout').updateManagedContent();
                                            FrameTrail.module('ViewLayout').updateContentInContentViews();
                                        }
                                    });
                                })(annotation.data.created, tagToAdd, self.labels);

                            });
                            tagManagementUI.find('.newTagButton .contextSelectList').append(tagItem);
                        }

                    }

                    // Timing

                    var oldAnnotationData;

                    (function() {
                        var $ts = controlsContainer.find('#TimeStart');
                        $ts.attr('max', FrameTrail.module('HypervideoModel').duration);
                        $ts.parent().attr('data-input-id', $ts.attr('id'));
                        oldAnnotationData = jQuery.extend({}, annotation.data);
                        $ts.on('input', function(evt) {
                            if(manualInputMode){
                                annotation.data.start = parseFloat(this.value);
                                annotation.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = annotation.data.start;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'AnnotationChange',
                                    annotation: annotation.data,
                                    changes: [{ property: 'start', oldValue: oldAnnotationData.start, newValue: annotation.data.start }]
                                });
                            }
                        });
                        $ts.on('change', function(evt) {
                            if(manualInputMode){
                                annotation.data.start = parseFloat($(evt.target).val());
                                annotation.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = annotation.data.start;
                                FrameTrail.module('AnnotationsController').stackTimelineView();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'AnnotationChange',
                                    annotation: annotation.data,
                                    changes: [{ property: 'start', oldValue: oldAnnotationData.start, newValue: annotation.data.start }]
                                });
                            }
                        });
                    }());

                    (function() {
                        var $te = controlsContainer.find('#TimeEnd');
                        $te.attr('max', FrameTrail.module('HypervideoModel').duration);
                        $te.parent().attr('data-input-id', $te.attr('id'));
                        $te.on('input', function(evt) {
                            if(manualInputMode){
                                annotation.data.end = parseFloat(this.value);
                                annotation.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = annotation.data.end;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'AnnotationChange',
                                    annotation: annotation.data,
                                    changes: [{ property: 'end', oldValue: oldAnnotationData.end, newValue: annotation.data.end }]
                                });
                            }
                        });
                        $te.on('change', function(evt) {
                            if(manualInputMode){
                                annotation.data.end = parseFloat($(evt.target).val());
                                annotation.updateTimelineElement();
                                FrameTrail.module('HypervideoController').currentTime = annotation.data.end;
                                FrameTrail.module('AnnotationsController').stackTimelineView();
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                FrameTrail.triggerEvent('userAction', {
                                    action: 'AnnotationChange',
                                    annotation: annotation.data,
                                    changes: [{ property: 'end', oldValue: oldAnnotationData.end, newValue: annotation.data.end }]
                                });
                            }
                        });
                    }());

                    // Add undo support for annotation time spinners
                    var annotationTimeBeforeEdit = {};
                    controlsContainer.find('#TimeStart, #TimeEnd').on('focus', function() {
                        annotationTimeBeforeEdit = {
                            start: annotation.data.start,
                            end: annotation.data.end
                        };
                    }).on('blur', function() {
                        if (annotationTimeBeforeEdit.start !== annotation.data.start ||
                            annotationTimeBeforeEdit.end !== annotation.data.end) {
                            (function(annotationId, oldTime, newTime, labels) {
                                var findAnnotation = function() {
                                    var annotations = FrameTrail.module('HypervideoModel').annotations;
                                    for (var i = 0; i < annotations.length; i++) {
                                        if (annotations[i].data.created === annotationId) {
                                            return annotations[i];
                                        }
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: 'annotations',
                                    description: labels['SidebarMyAnnotations'] + ' Time',
                                    undo: function() {
                                        var a = findAnnotation();
                                        if (!a) return;
                                        a.data.start = oldTime.start;
                                        a.data.end = oldTime.end;
                                        a.updateTimelineElement();
                                        FrameTrail.module('AnnotationsController').stackTimelineView();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                    },
                                    redo: function() {
                                        var a = findAnnotation();
                                        if (!a) return;
                                        a.data.start = newTime.start;
                                        a.data.end = newTime.end;
                                        a.updateTimelineElement();
                                        FrameTrail.module('AnnotationsController').stackTimelineView();
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                                    }
                                });
                            })(annotation.data.created, 
                               JSON.parse(JSON.stringify(annotationTimeBeforeEdit)), 
                               { start: annotation.data.start, end: annotation.data.end }, 
                               self.labels);
                        }
                    });

                    controlsContainer.find('.deleteAnnotation').click(function(){

                        try {
                            if (TogetherJS && TogetherJS.running) {
                                var elementFinder = TogetherJS.require("elementFinder");
                                var location = elementFinder.elementLocation($(this)[0]);
                                TogetherJS.send({
                                    type: "simulate-special-click", 
                                    element: location
                                });
                            }
                        } catch (e) {}
                        
                        FrameTrail.module('AnnotationsController').deleteAnnotation(annotation);

                    });

                    var PropertiesControlsInterface = {

                        controlsContainer: controlsContainer,

                        changeStart:  function(val) {
                            manualInputMode = false;
                            controlsContainer.find('#TimeStart').val(val);
                            manualInputMode = true;
                        },

                        changeEnd: function(val) {
                            manualInputMode = false;
                            controlsContainer.find('#TimeEnd').val(val);
                            manualInputMode = true;
                        }

                    }




                    return PropertiesControlsInterface;

                },

                /**
                 * I hold the icon class for this resource type.
                 * Subtypes should override this.
                 * @attribute iconClass
                 * @type String
                 */
                iconClass: 'icon-doc',

                /**
                 * I return a display label for timeline elements.
                 * Subtypes can override for custom behavior.
                 * @method getDisplayLabel
                 * @return String
                 */
                getDisplayLabel: function() {
                    return this.resourceData.name || this.resourceData.type || '';
                }



            }


        }
    }

);
