/**
 * @module Player
 */


/**
 * I am the CodeSnippetsController. I am responsible for managing all the {{#crossLink "CodeSnippet"}}codeSnippets{{/crossLink}}
 * in the current {{#crossLink "HypervideoModel"}}HypervideoModel{{/crossLink}}, and for displaying them for viewing and editing.
 *
 * @class CodeSnippetsController
 * @static
 */



FrameTrail.defineModule('CodeSnippetsController', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    var codeSnippets       = FrameTrail.module('HypervideoModel').codeSnippets, // can be shadowed be function local vars
        ViewVideo          = FrameTrail.module('ViewVideo'),
        codeSnippetInFocus = null;


    /**
     * I tell all codeSnippets in the
     * {{#crossLink "HypervideoModel/codeSnippets:attribute"}}HypervideoModel/codeSnippets attribute{{/crossLink}}
     * to render their elements into the DOM.
     * @method initController
     */
    function initController() {

        var hypervideoModel = FrameTrail.module('HypervideoModel');

        for (var i = 0; i < hypervideoModel.codeSnippets.length; i++) {

            hypervideoModel.codeSnippets[i].renderTimelineInDOM();
            hypervideoModel.codeSnippets[i].initCodeSnippetFunction();

        }

        initCustomCSS(hypervideoModel.customCSS);

    };



    /**
     * I remove all tileElements and codeSnippetElements from the DOM and then
     * re-append them again.
     *
     * This has the purpose that the DOM elements must appear in a sorted order by their start time. So this method has to called
     * after the user has finished editing.
     *
     * @method rearrangeTilesAndContent
     */
    function rearrangeTilesAndContent() {

        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;

        for (var i = 0; i < codeSnippets.length; i++) {

            codeSnippets[i].initCodeSnippetFunction();

        }


    };


    /**
     * I am a central method of the CodeSnippetsController.
     * I am called from the update functions inside the HypervideoController
     * and I set the activeState of the codeSnippets according to the current time.
     *
     * @method updateStatesOfCodeSnippets
     * @param {Number} currentTime
     */
    function updateStatesOfCodeSnippets(currentTime) {

        var codeSnippet;

        for (var idx in codeSnippets) {

            codeSnippet = codeSnippets[idx];

            if (    codeSnippet.data.start <= currentTime
                 && codeSnippet.data.start+2 >= currentTime) {

                if (!codeSnippet.activeState && !codeSnippetInFocus) {

                    codeSnippet.setActive();

                }

            } else {

                if (codeSnippet.activeState) {

                    codeSnippet.setInactive();

                }

            }

        }

        if (codeSnippetInFocus && !codeSnippetInFocus.activeState) {
            // don't execute custom code when editing snippet
            //codeSnippetInFocus.setActive();
        }


    };


    /**
     * When we are in the editMode annotations, the timeline should
     * show all timeline elements stacked, which is what I do.
     * @method stackTimelineView
     */
    function stackTimelineView() {

        var scroller = ViewVideo.CodeSnippetTimeline.find('.timelineScroller');
        if (scroller.length) {
            scroller.CollisionDetection({spacing:0, includeVerticalMargins: true, exclude: '.timelinePlayhead', containerPadding: 4});
            ViewVideo.CodeSnippetTimeline.css({
                height: scroller.css('height'),
                'flex-basis': scroller.css('flex-basis')
            });
        } else {
            ViewVideo.CodeSnippetTimeline.CollisionDetection({spacing:0, includeVerticalMargins: true});
        }
        ViewVideo.adjustLayout();
        ViewVideo.adjustHypervideo();

        if (FrameTrail.module('TimelineController').initialized) {
            FrameTrail.module('TimelineController').refreshMinimap();
        }

    };


    /**
     * When we are in the editMode annotations, the timeline should
     * show all timeline elements stacked. After leaving this mode,
     * I have to reset the timelineElements and the timeline to their normal
     * layout.
     * @method resetTimelineView
     * @private
     */
    function resetTimelineView() {

        ViewVideo.CodeSnippetTimeline.css('height', '');
        var target = ViewVideo.CodeSnippetTimeline.find('.timelineScroller');
        if (target.length) {
            target.css({ height: '', 'flex-basis': '' });
        }
        (target.length ? target : ViewVideo.CodeSnippetTimeline).children('.timelineElement').css({
            top:    '',
            right:  '',
            bottom: '',
            height: ''
        });

    };



    /**
     * When the editMode 'codesnippets' was entered, the #EditingOptions area
     * should show two tabs:
     * * a list of (draggable) thumbnails with available hypervideos
     * * a text form, where the user can manually input a link URL
     *
     * @method initEditOptions
     * @private
     */
    function initEditOptions() {

        ViewVideo.EditingOptions.empty();

        ViewVideo.EditingOptions.append(
            '<div class="message active"><span class="icon-code"></span> '+ labels['MessageHintDragCodeSnippets'] +'</div>'
        );

        var hypervideos = FrameTrail.module('Database').hypervideos,
            thumb,
            events      = FrameTrail.module('HypervideoModel').events,
            customCSS   = FrameTrail.module('HypervideoModel').customCSS,

            codeSnippetEditingOptions = $('<div class="codeSnippetEditingTabs">'
                                    +   '    <ul>'
                                    +   '        <li><a href="#CodeSnippetList">'+ labels['SettingsCodeSnippetAdd'] +'</a></li>'
                                    +   '        <li><a href="#CustomCSS">'+ labels['GenericCustomCSS'] +'</a></li>'
                                    +   '        <li class="ui-tabs-right"><a href="#EventOnEnded">onEnded</a></li>'
                                    +   '        <li class="ui-tabs-right"><a href="#EventOnPause">onPause</a></li>'
                                    +   '        <li class="ui-tabs-right"><a href="#EventOnPlay">onPlay</a></li>'
                                    +   '        <li class="ui-tabs-right"><a href="#EventOnReady">onReady</a></li>'
                                    +   '        <li class="ui-tabs-right tab-label">Events: </li>'
                                    +   '    </ul>'
                                    +   '    <div id="CustomCSS">'
                                    +   '        <div class="message active">'+ labels['MessageCustomCSSHypervideo'] +'</div>'
                                    +   '        <div style="position: relative; height: calc(100% - 23px);">'
                                    +   '            <textarea class="customCSS cssTextarea">' + (customCSS ? customCSS : '') + '</textarea>'
                                    +   '        </div>'
                                    +   '    </div>'
                                    +   '    <div id="CodeSnippetList">'
                                    +   '    </div>'
                                    +   '    <div id="EventOnReady">'
                                    +   '        <textarea class="onReadyCode codeTextarea" data-eventname="onReady">' + (events.onReady ? events.onReady : '') + '</textarea>'
                                    +   '        <button class="executeEventCode">'+ labels['SettingsTestCode'] +'</button>'
                                    +   '    </div>'
                                    +   '    <div id="EventOnPlay">'
                                    +   '        <textarea class="onPlayCode codeTextarea" data-eventname="onPlay">' + (events.onPlay ? events.onPlay : '') + '</textarea>'
                                    +   '        <button class="executeEventCode">'+ labels['SettingsTestCode'] +'</button>'
                                    +   '    </div>'
                                    +   '    <div id="EventOnPause">'
                                    +   '        <textarea class="onPauseCode codeTextarea" data-eventname="onPause">' + (events.onPause ? events.onPause : '') + '</textarea>'
                                    +   '        <button class="executeEventCode">'+ labels['SettingsTestCode'] +'</button>'
                                    +   '    </div>'
                                    +   '    <div id="EventOnEnded">'
                                    +   '        <textarea class="onEndedCode codeTextarea" data-eventname="onEnded">' + (events.onEnded ? events.onEnded : '') + '</textarea>'
                                    +   '        <button class="executeEventCode">'+ labels['SettingsTestCode'] +'</button>'
                                    +   '    </div>'
                                    +   '</div>')
                                    .tabs({
                                        heightStyle: 'fill',
                                        activate: function(event, ui) {
                                            var cm6Wrapper = ui.newPanel.find('.cm6-wrapper')[0];
                                            if (cm6Wrapper && cm6Wrapper._cm6view) { cm6Wrapper._cm6view.requestMeasure(); }
                                        }
                                    }),

            codeSnippetList = codeSnippetEditingOptions.find('#CodeSnippetList');

        codeSnippetEditingOptions.find('.executeEventCode').click(function(evt) {
            var textarea = $(evt.currentTarget).siblings('textarea');
            try {
                var testRun = new Function('FrameTrail', textarea.val());
                testRun(FrameTrail);
            } catch (exception) {
                alert(labels['MessageCodeContainsErrors'] +': '+ exception.message);
            }
        });

        // Append Editing Options
        ViewVideo.EditingOptions.append(codeSnippetEditingOptions);

        /* Append custom code snippet element to 'Custom Code Snippet' tab */
        // TODO: Move to separate function
        var codeSnippetElement = $('<div class="codeSnippetElement" data-type="codesnippet">'
                   + '                  <div class="codeSnippetTitle">'+ labels['SettingsCodeSnippetCustom'] +'</div>'
                   + '              </div>');

        codeSnippetElement.draggable({
            containment:    '.mainContainer',
            helper:         'clone',
            revert:         'invalid',
            revertDuration: 100,
            appendTo:       'body',
            distance:       10,
            zIndex:         1000,

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

        codeSnippetList.append(codeSnippetElement);

        // Init CodeMirror 6 editors for Events

        var CM6 = window.FrameTrailCM6;
        var codeTextareas = codeSnippetEditingOptions.find('.codeTextarea');

        for (var i=0; i<codeTextareas.length; i++) {
            (function(textarea) {
                var cm6Wrapper = $('<div class="cm6-wrapper" style="height: 100%;"></div>');
                textarea.after(cm6Wrapper).hide();
                var codeEditor = new CM6.EditorView({
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
                            CM6.EditorView.updateListener.of(function(update) {
                                if (!update.docChanged) { return; }
                                var currentEvents = FrameTrail.module('HypervideoModel').events;
                                currentEvents[textarea.data('eventname')] = update.state.doc.toString();
                                FrameTrail.module('HypervideoModel').events = currentEvents;
                            })
                        ]
                    }),
                    parent: cm6Wrapper[0]
                });
                cm6Wrapper[0]._cm6view = codeEditor;
            })(codeTextareas.eq(i));
        }

        // Init CodeMirror 6 editors for Custom CSS

        var cssTextareas = codeSnippetEditingOptions.find('.cssTextarea');

        for (var i=0; i<cssTextareas.length; i++) {
            (function(textarea) {
                var cm6Wrapper = $('<div class="cm6-wrapper" style="height: 100%;"></div>');
                textarea.after(cm6Wrapper).hide();
                var codeEditor = new CM6.EditorView({
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
                            CM6.StreamLanguage.define(CM6.legacyModes.css),
                            window.FrameTrailCM6Linters.css,
                            CM6.lintGutter(),
                            CM6.EditorView.updateListener.of(function(update) {
                                if (!update.docChanged) { return; }
                                var newValue = update.state.doc.toString();
                                FrameTrail.module('HypervideoModel').customCSS = newValue;
                                updateCustomCSS(newValue);
                            })
                        ]
                    }),
                    parent: cm6Wrapper[0]
                });
                cm6Wrapper[0]._cm6view = codeEditor;
            })(cssTextareas.eq(i));
        }


    };


    /**
     * When the editMode 'codesnippets' has been entered, the
     * codeSnippet timeline should be droppable for new items
     * (from the tab of available hypervideos, see {{#crossLink "CodeSnippetsController/initEditOptions:method"}}CodeSnippetsController/initEditOptions{{/crossLink}}).
     * A drop event should trigger the process of creating a new codeSnippet.
     * My parameter is true or false to activate or deactivate this behavior.
     * @method makeTimelineDroppable
     * @param {Boolean} active
     */
    function makeTimelineDroppable(active) {

        if (active) {

            ViewVideo.CodeSnippetTimeline.droppable({
                accept:         '.codeSnippetElement',
                classes:        { 'ui-droppable-active': 'droppableActive', 'ui-droppable-hover': 'droppableHover' },
                tolerance:      'touch',

                over: function( event, ui ) {
                    ViewVideo.PlayerProgress.find('.ui-slider-handle').addClass('highlight');
                },

                out: function( event, ui ) {
                    ViewVideo.PlayerProgress.find('.ui-slider-handle').removeClass('highlight');
                },

                drop: function( event, ui ) {

                    var codeSnippetTitle = ui.helper.find('.codeSnippetTitle').text(),
                        startTime        = FrameTrail.module('HypervideoController').currentTime,

                        newCodeSnippet = FrameTrail.module('HypervideoModel').newCodeSnippet({
                            "start":   startTime,
                            "name":    codeSnippetTitle,
                            "snippet": 'console.log("Hello, I am a Code Snippet");'
                        });


                    newCodeSnippet.renderTimelineInDOM();
                    rearrangeTilesAndContent();

                    newCodeSnippet.startEditing();
                    updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);
                    setCodeSnippetInFocus(newCodeSnippet);

                    stackTimelineView();
                    FrameTrail.module('TimelineController').refreshMinimap();

                    // Register undo command for adding code snippet
                    (function(codeSnippetData) {
                        var findCodeSnippet = function() {
                            var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;
                            for (var i = 0; i < codeSnippets.length; i++) {
                                if (codeSnippets[i].data.created === codeSnippetData.created) {
                                    return codeSnippets[i];
                                }
                            }
                            return null;
                        };
                        FrameTrail.module('UndoManager').register({
                            category: 'codeSnippets',
                            description: labels['SidebarCustomCode'] + ' ' + labels['GenericAdd'],
                            undo: function() {
                                var codeSnippet = findCodeSnippet();
                                if (codeSnippet) {
                                    deleteCodeSnippet(codeSnippet, true);
                                }
                            },
                            redo: function() {
                                var restoredCodeSnippet = FrameTrail.module('HypervideoModel').newCodeSnippet(codeSnippetData, true);
                                restoredCodeSnippet.renderTimelineInDOM();
                                restoredCodeSnippet.startEditing();
                                updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);
                                stackTimelineView();
                                FrameTrail.module('TimelineController').refreshMinimap();
                            }
                        });
                    })(JSON.parse(JSON.stringify(newCodeSnippet.data)));

                    ViewVideo.PlayerProgress.find('.ui-slider-handle').removeClass('highlight');


                }

            });


        } else {

            if (ViewVideo.CodeSnippetTimeline.hasClass('ui-droppable')) {
                ViewVideo.CodeSnippetTimeline.droppable('destroy');
            }

        }

    }



    /**
     * When a codeSnippet is set into focus, I have to tell
     * the old codeSnippet in the var codeSnippetInFocus, that it
     * is no longer in focus. Then I store the codeSnippet (or null)
     * from my parameter in the var codeSnippetInFocus, and inform it
     * about it.
     * @method setCodeSnippetInFocus
     * @param {CodeSnippet} codeSnippet
     * @private
     */
    function setCodeSnippetInFocus(codeSnippet) {


        if (codeSnippetInFocus) {

            codeSnippetInFocus.permanentFocusState = false;
            codeSnippetInFocus.removedFromFocus();

        }

        codeSnippetInFocus = codeSnippet;

        if (codeSnippetInFocus) {
            codeSnippetInFocus.gotInFocus();
        }

        updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);

        return codeSnippet;


    };




    /**
     * I listens to the global state 'editMode'.
     *
     * If we enter the editMode "codesnippets" I prepare all codeSnippets for editing, prepare the timeline
     * and the "editOptions" interface.
     *
     * When leaving I reset them.
     *
     * @method toggleEditMode
     * @param {String} editMode
     * @param {String} oldEditMode
     */
    function toggleEditMode(editMode, oldEditMode) {

        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;


        if(editMode === 'codesnippets' && oldEditMode !== 'codesnippets') {

            for (var idx in codeSnippets) {

                codeSnippets[idx].startEditing();

            }

            stackTimelineView();
            initEditOptions();
            makeTimelineDroppable(true);



        } else if (oldEditMode === 'codesnippets' && editMode !== 'codesnippets') {

            for (var idx in codeSnippets) {

                codeSnippets[idx].stopEditing();

            }

            setCodeSnippetInFocus(null);
            resetTimelineView();
            rearrangeTilesAndContent();
            makeTimelineDroppable(false);

        }

    }


    /**
     * I react to changes in the global state "viewSize" (which is triggerd by a resize event of the window).
     * @method changeViewSize
     */
    function changeViewSize() {



    }


    /**
     * I react to changes in the global state viewSizeChanged.
     * The state changes after a window resize event
     * and is meant to be used for performance-heavy operations.
     *
     * @method onViewSizeChanged
     * @private
     */
    function onViewSizeChanged() {

        if (codeSnippetInFocus && codeSnippetInFocus.cm6Wrapper) {
            var editorHeight = ViewVideo.EditPropertiesContainer.height() - 70;
            codeSnippetInFocus.cm6Wrapper.css('height', editorHeight + 'px');
        }

    }


    /**
     * I react to changes in the global state "sidebarOpen".
     * @method toggleSidebarOpen
     */
    function toggleSidebarOpen() {



    }


    /**
     * I open the codeSnippetElement of a codeSnippet in the codeSnippetContainer.
     *
     * If my parameter is null, I close the codeSnippetContainer.
     *
     * @method setOpenedCodeSnippet
     * @param {CodeSnippet} codeSnippet
     */
    function setOpenedCodeSnippet(codeSnippet) {

        openedCodeSnippet = codeSnippet

        for (var idx in codeSnippets) {

            codeSnippets[idx].codeSnippetElement.removeClass('open');
            codeSnippets[idx].tileElement.removeClass('open');

            codeSnippets[idx].codeSnippetElement.children('iframe').attr('src', '');

        }

        if (codeSnippet) {

            // randomVersion allows to use the same iFrame src several times
            var randomVersion  = Math.round(Math.random() * (100 - 1) + 1),
                fragmentSplit  = codeSnippet.data.href.split('#'),
                randomizedLink = fragmentSplit[0] + '&v=' + randomVersion + '#' + fragmentSplit[1];

            codeSnippet.codeSnippetElement.children('iframe').attr('src', randomizedLink);

            codeSnippet.codeSnippetElement.addClass('open');
            codeSnippet.tileElement.addClass('open');
            ViewVideo.shownDetails = 'codeSnippets';

        } else {

            ViewVideo.shownDetails = null;

        }

    }


    /**
     * I am the starting point for the process of deleting
     * a codeSnippet. I call other necessary methods for it.
     * @method deleteCodeSnippet
     * @param {CodeSnippet} codeSnippet
     * @param {Boolean} skipUndo - If true, don't register undo command (used during undo/redo)
     */
    function deleteCodeSnippet(codeSnippet, skipUndo) {

        // Capture data before deletion for undo
        var codeSnippetData = JSON.parse(JSON.stringify(codeSnippet.data));

        setCodeSnippetInFocus(null);
        codeSnippet.removeFromDOM();
        FrameTrail.module('HypervideoModel').removeCodeSnippet(codeSnippet);
        stackTimelineView();
        FrameTrail.module('TimelineController').refreshMinimap();

        // Register undo command
        if (!skipUndo) {
            FrameTrail.module('UndoManager').register({
                category: 'codeSnippets',
                description: labels['SidebarCustomCode'] + ' ' + labels['GenericDelete'],
                undo: function() {
                    // Recreate the code snippet
                    var newCodeSnippet = FrameTrail.module('HypervideoModel').newCodeSnippet(codeSnippetData, true);
                    newCodeSnippet.renderTimelineInDOM();
                    newCodeSnippet.startEditing();
                    updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);
                    stackTimelineView();
                    FrameTrail.module('TimelineController').refreshMinimap();
                },
                redo: function() {
                    // Find the code snippet by matching data and delete it again
                    var codeSnippetsArray = FrameTrail.module('HypervideoModel').codeSnippets;
                    for (var i = 0; i < codeSnippetsArray.length; i++) {
                        if (codeSnippetsArray[i].data.created === codeSnippetData.created) {
                            deleteCodeSnippet(codeSnippetsArray[i], true);
                            break;
                        }
                    }
                }
            });
        }

    }


    /**
     * I initialize the custom CSS rules.
     *
     * @method initCustomCSS
     * @param {String} cssString
     */
    function initCustomCSS(cssString) {

        $('head').append('<style class="FrameTrailCustomCSS" type="text/css">'+ cssString +'</style>');

    }


    /**
     * I dynamically update the custom CSS rules.
     *
     * @method updateCustomCSS
     * @param {String} cssString
     */
    function updateCustomCSS(cssString) {
        $('head > style.FrameTrailCustomCSS').html(cssString);

    }


    /**
     * I react to changes in the global state "viewMode".
     *
     * @method toggleViewMode
     * @param {String} viewMode
     * @param {String} oldViewMode
     */
    function toggleViewMode(viewMode, oldViewMode){



    }


    return {

        onChange: {
            editMode:        toggleEditMode,
            viewSize:        changeViewSize,
            viewSizeChanged: onViewSizeChanged,
            sidebarOpen:     toggleSidebarOpen,
            viewMode:        toggleViewMode
        },

        initController:             initController,
        updateStatesOfCodeSnippets:   updateStatesOfCodeSnippets,
        stackTimelineView:          stackTimelineView,
        deleteCodeSnippet:            deleteCodeSnippet,

        /**
         * I hold the currently opened codeSnippet (or null, when there is no opened snippet).
         * I use the {{#crossLink "CodeSnippetsController/setOpenedLink:method"}}CodeSnippetsController/setOpenedLink(){{/crossLink}}.
         * @attribute openedLink
         * @type CodeSnippet
         */
        get openedCodeSnippet()              { return openedCodeSnippet                 },
        set openedCodeSnippet(codeSnippet)   { return setOpenedCodeSnippet(codeSnippet) },

        /**
         * I hold the codeSnippet which is "in focus" (or null, when there is no snippet in focus).
         * I use the {{#crossLink "CodeSnippetsController/setCodeSnippetInFocus:method"}}CodeSnippetsController/setCodeSnippetInFocus(){{/crossLink}}.
         * @attribute codeSnippetInFocus
         * @type CodeSnippet
         */
        set codeSnippetInFocus(codeSnippet) { return setCodeSnippetInFocus(codeSnippet) },
        get codeSnippetInFocus()            { return codeSnippetInFocus               }


    };

});
