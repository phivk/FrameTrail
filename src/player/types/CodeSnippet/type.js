/**
 * @module Player
 */


/**
 * I am the type definition of a CodeSnippet.
 *
 * A code snippet is a short piece of code which is executed at a certain point of time.
 *
 * CodeSnippets are managed by the {{#crossLink "CodeSnippetsController"}}CodeSnippetsController{{/crossLink}}.
 *
 * @class CodeSnippet
 * @category TypeDefinition
 */



FrameTrail.defineType(

    'CodeSnippet',

    function (FrameTrail) {
        return {
            constructor: function(data){

                this.labels = FrameTrail.module('Localization').labels;

                this.data = data;

                this.timelineElement  = $('<div class="timelineElement" data-type="codesnippet"><div class="timelineElementIcon"><span class="icon-code"></span></div><div class="timelineElementLabel"></div><div class="previewWrapper"></div></div>');
                this.codeSnippetFunction = new Function('');


            },
            prototype: {

                /**
                 * I hold the data object of a CodeSnippet, which is stored in the {{#crossLink "Database"}}Database{{/crossLink}} and saved in the hypervideos's codeSnippets.json file.
                 * @attribute data
                 * @type {}
                 */
                data:                   {},

                /**
                 * I hold the timelineElement (a jquery-enabled HTMLElement), which indicates my start and end time.
                 * @attribute timelineElement
                 * @type HTMLElement
                 */
                timelineElement:        null,

                /**
                 * I hold the codeSnippetFunction, which will be executed at a certain point of time.
                 * @attribute codeSnippetElement
                 * @type HTMLElement
                 */
                codeSnippetFunction:    null,

                /**
                 * I hold the codeEditorInstance (if initialized).
                 * @attribute codeEditorInstance
                 * @type HTMLElement
                 */
                codeEditorInstance:    null,

                /**
                 * I store my state, wether I am "active" (this is, when my timelineElement and tileElements are highlighted) or not.
                 * @attribute activeState
                 * @type Boolean
                 */
                activeState:            false,


                /**
                 * I store my state, wether I am "in focus" or not. See also:
                 * * {{#crossLink "CodeSnippet/gotInFocus:method"}}CodeSnippet/gotInFocus(){{/crossLink}}
                 * * {{#crossLink "CodeSnippet/removedFromFocus:method"}}CodeSnippet/removedFromFocus(){{/crossLink}}
                 * * {{#crossLink "CodeSnippetsController/codeSnippetInFocus:attribute"}}CodeSnippetsController/codeSnippetInFocus{{/crossLink}}
                 * @attribute permanentFocusState
                 * @type Boolean
                 */
                permanentFocusState:    false,


                /**
                 * I render my ({{#crossLink "CodeSnippet/timelineElement:attribute"}}this.timelineElement{{/crossLink}}
                 * into the DOM.
                 *
                 * I am called, when the CodeSnippet is initialized.
                 *
                 * @method renderTimelineInDOM
                 */
                renderTimelineInDOM: function () {

                    var ViewVideo = FrameTrail.module('ViewVideo');

                    // Set label from snippet name
                    var label = this.data.name || 'Code Snippet';
                    this.timelineElement.find('.timelineElementLabel').text(label);

                    this.timelineElement.unbind('hover');
                    this.timelineElement.hover(this.brushIn.bind(this), this.brushOut.bind(this));

                    // Preview wrapper with code snippet preview
                    var snippetPreview = this.data.snippet ? this.data.snippet.substring(0, 100) : '';
                    this.timelineElement.find('.previewWrapper').empty().append(
                        $('<div class="resourceThumb" data-type="text">')
                            .append('<div class="resourceTextPreview">' + $('<span>').text(snippetPreview).html() + '</div>')
                    );

                    var timelineTarget = ViewVideo.CodeSnippetTimeline.find('.timelineScroller');
                    (timelineTarget.length ? timelineTarget : ViewVideo.CodeSnippetTimeline).append(this.timelineElement);
                    this.updateTimelineElement();


                },

                /**
                 * I init my ({{#crossLink "CodeSnippet/codeSnippetFunction:attribute"}}this.codeSnippetFunction{{/crossLink}}
                 *
                 * I am called, when the CodeSnippet is initialized, and also every time, when the global state "editMode" leaves the state
                 * "codesnippets". This is the case, when the user has finished his/her changes to the CodeSnippets.
                 *
                 * @method initCodeSnippetFunction
                 */
                initCodeSnippetFunction: function () {

                    try {
                        this.codeSnippetFunction = new Function('FrameTrail', this.data.snippet);
                    } catch (exception) {
                        // could not parse and compile JS code!
                        console.warn(this.labels['MessageCodeContainsErrors'] +': '+ exception.message);
                    }

                },


                /**
                 * I remove all my elements from the DOM. I am called when a CodeSnippet is to be deleted.
                 * @method removeFromDOM
                 */
                removeFromDOM: function () {

                    this.timelineElement.remove();

                },

                /**
                 * I update the CSS of the {{#crossLink "CodeSnippet/timelineElement:attribute"}}timelineElement{{/crossLink}}
                 * to its correct position within the timeline.
                 *
                 * @method updateTimelineElement
                 */
                updateTimelineElement: function () {

                    var HypervideoModel = FrameTrail.module('HypervideoModel'),
                        videoDuration   = HypervideoModel.duration,
                        positionLeft    = 100 * ((this.data.start - HypervideoModel.offsetIn) / videoDuration);

                    this.timelineElement.css({
                        top: '',
                        left:  positionLeft + '%',
                        right: ''
                    });

                    this.timelineElement.removeClass('previewPositionLeft previewPositionRight');

                    if (positionLeft < 10) {
                        this.timelineElement.addClass('previewPositionLeft');
                    } else if (positionLeft > 90) {
                        this.timelineElement.addClass('previewPositionRight');
                    }

                },



                /**
                 * When I am scheduled to be executed, this is the method to be called.
                 * @method setActive
                 */
                setActive: function () {

                    this.activeState = true;

                    this.timelineElement.addClass('active');

                    try {
                        this.codeSnippetFunction(FrameTrail);
                    } catch (exception) {
                        // do some user error feedback (ex.message)
                        console.warn(this.labels['MessageCodeContainsErrors'] +': '+ exception.message);
                    }

                },

                /**
                 * When I am scheduled to disappear, this is the method to be called.
                 * @method setInactive
                 */
                setInactive: function () {

                    this.activeState = false;

                    this.timelineElement.removeClass('active');

                },


                /**
                 * I am called when the mouse pointer is hovering over one of my tile or my timeline element
                 * @method brushIn
                 */
                brushIn: function () {

                    this.timelineElement.addClass('brushed');

                },

                /**
                 * I am called when the mouse pointer is leaving the hovering area over my tile or my timeline element.
                 * @method brushOut
                 */
                brushOut: function () {

                    this.timelineElement.removeClass('brushed');

                },

                /**
                 * I am called when the app switches to the editMode "codesnippets".
                 *
                 * I make sure
                 * * that my {{#crossLink "CodeSnippet/timelineElement:attribute"}}timelineElement{{/crossLink}} is resizable and draggable
                 * * and that it has a click handler for putting myself into focus.
                 *
                 * @method startEditing
                 */
                startEditing: function () {


                    var self = this,
                        CodeSnippetsController = FrameTrail.module('CodeSnippetsController');

                    this.makeTimelineElementDraggable();

                    this.timelineElement.on('click', function(){

                        if (CodeSnippetsController.codeSnippetInFocus === self){
                            return CodeSnippetsController.codeSnippetInFocus = null;
                        }

                        self.permanentFocusState = true;
                        CodeSnippetsController.codeSnippetInFocus = self;

                        FrameTrail.module('HypervideoController').currentTime = self.data.start;

                    });


                },

                /**
                 * When the global editMode leaves the state "codesnippets", I am called to
                 * stop the editing features of the code snippet.
                 *
                 * @method stopEditing
                 */
                stopEditing: function () {

                    if (this.timelineElement[0]) {
                        try { interact(this.timelineElement[0]).unset(); } catch (ex) {}
                    }
                    this.timelineElement.removeClass('ui-draggable ui-draggable-dragging');

                    this.timelineElement.unbind('click');


                },


                /**
                 * I make my {{#crossLink "CodeSnippet/timelineElement:attribute"}}timelineElement{{/crossLink}} draggable.
                 *
                 * The event handling changes my this.data.start and this.data.end attributes
                 * accordingly.
                 *
                 * @method makeTimelineElementDraggable
                 */
                makeTimelineElementDraggable: function () {

                    var self = this,
                        oldStart;

                    var el = this.timelineElement[0];
                    this.timelineElement.addClass('ui-draggable');

                    interact(el).draggable({
                        listeners: {
                            start: function(e) {

                                if (!self.permanentFocusState) {
                                    FrameTrail.module('CodeSnippetsController').codeSnippetInFocus = self;
                                }

                                // Capture old value for undo
                                oldStart = self.data.start;

                                e.target.dataset.ftX    = e.target.offsetLeft;
                                e.target.dataset.ftRawX = e.target.offsetLeft;
                                e.target.style.left     = e.target.offsetLeft + 'px';
                                e.target.classList.add('ui-draggable-dragging');

                            },

                            move: function(e) {

                                var rawX = parseFloat(e.target.dataset.ftRawX) + e.dx;
                                e.target.dataset.ftRawX = rawX;
                                var x           = rawX;
                                var parentWidth = e.target.parentElement.offsetWidth;
                                var elWidth     = e.target.offsetWidth;

                                var closestGridline = FrameTrail.module('ViewVideo').closestToOffset(
                                    $(FrameTrail.getState('target')).find('.gridline'),
                                    { left: x, top: 0 }
                                );
                                var snapTolerance = 10;

                                if (closestGridline) {
                                    $(FrameTrail.getState('target')).find('.gridline').css('background-color', '#ff9900');
                                    var glLeft = closestGridline.position().left;
                                    if (x - snapTolerance < glLeft && x + snapTolerance > glLeft) {
                                        x = glLeft;
                                        closestGridline.css('background-color', '#00ff00');
                                    }
                                }

                                x = Math.max(0, Math.min(parentWidth - elWidth, x));

                                e.target.style.left  = x + 'px';
                                e.target.dataset.ftX = x;

                                var HypervideoModel = FrameTrail.module('HypervideoModel'),
                                    videoDuration = HypervideoModel.duration,
                                    leftPercent   = 100 * (x / parentWidth),
                                    newStartValue = (leftPercent * (videoDuration / 100)) + HypervideoModel.offsetIn;

                                FrameTrail.module('HypervideoController').currentTime = newStartValue;

                            },

                            end: function(e) {

                                if (!self.permanentFocusState) {
                                    FrameTrail.module('CodeSnippetsController').codeSnippetInFocus = null;
                                }

                                e.target.classList.remove('ui-draggable-dragging');

                                var x           = parseFloat(e.target.dataset.ftX);
                                var parentWidth = e.target.parentElement.offsetWidth;

                                var HypervideoModel = FrameTrail.module('HypervideoModel'),
                                    videoDuration = HypervideoModel.duration,
                                    leftPercent   = 100 * (x / parentWidth);

                                var newStart = (leftPercent * (videoDuration / 100)) + HypervideoModel.offsetIn;
                                self.data.start = newStart;

                                self.updateTimelineElement();

                                FrameTrail.module('CodeSnippetsController').stackTimelineView();

                                FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');

                                // Register undo command for timeline drag
                                (function(codeSnippetId, capturedOldStart, capturedNewStart) {
                                    var findCodeSnippet = function() {
                                        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;
                                        for (var i = 0; i < codeSnippets.length; i++) {
                                            if (codeSnippets[i].data.created === codeSnippetId) {
                                                return codeSnippets[i];
                                            }
                                        }
                                        return null;
                                    };
                                    FrameTrail.module('UndoManager').register({
                                        category: 'codeSnippets',
                                        description: self.labels['SidebarCustomCode'] + ' Move',
                                        undo: function() {
                                            var codeSnippet = findCodeSnippet();
                                            if (!codeSnippet) return;
                                            codeSnippet.data.start = capturedOldStart;
                                            codeSnippet.updateTimelineElement();
                                            FrameTrail.module('CodeSnippetsController').stackTimelineView();
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');
                                        },
                                        redo: function() {
                                            var codeSnippet = findCodeSnippet();
                                            if (!codeSnippet) return;
                                            codeSnippet.data.start = capturedNewStart;
                                            codeSnippet.updateTimelineElement();
                                            FrameTrail.module('CodeSnippetsController').stackTimelineView();
                                            FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');
                                        }
                                    });
                                })(self.data.created, oldStart, newStart);

                            }
                        }
                    });

                },


                /**
                 * When I "got into focus" (which happens, when I become the referenced object in the CodeSnippetsController's
                 * {{#crossLink "CodeSnippetsController/codeSnippetInFocus:attribute"}}codeSnippetInFocus attribute{{/crossLink}}),
                 * then this method will be called.
                 *
                 * @method gotInFocus
                 */
                gotInFocus: function () {

                    var EditPropertiesContainer = FrameTrail.module('ViewVideo').EditPropertiesContainer,
                        self = this;

                    EditPropertiesContainer.empty();

                    var propertiesControls = $('<div>'
                                             + '    <div class="propertiesTypeIcon" data-type="codesnippet"><span class="icon-code"></span></div>'
                                             + '    <textarea class="codeSnippetCode">' + this.data.snippet + '</textarea>'
                                             + '    <button class="deleteCodeSnippet">'+ this.labels['GenericDelete'] +'</button>'
                                             + '    <button class="executeCodeSnippet">'+ this.labels['SettingsTestCode'] +'</button>'
                                             + '</div>');

                    propertiesControls.find('.deleteCodeSnippet').click(function() {
                        FrameTrail.module('CodeSnippetsController').deleteCodeSnippet(self);
                    });

                    propertiesControls.find('.executeCodeSnippet').click(function() {
                        try {
                            var testRun = new Function('FrameTrail', self.data.snippet);
                            testRun(FrameTrail);
                        } catch (exception) {
                            alert('Code contains errors: '+ exception.message);
                        }
                    });

                    EditPropertiesContainer.addClass('active').append(propertiesControls);
                    FrameTrail.module('ViewVideo').switchInfoTab('properties');


                    var snippetElement = propertiesControls.find('.codeSnippetCode'),
                        snippet = snippetElement.val();

                    var CM6 = window.FrameTrailCM6;
                    var editorHeight = FrameTrail.module('ViewVideo').EditPropertiesContainer.height() - 70;
                    var cm6Wrapper = $('<div class="cm6-wrapper"></div>').css('height', editorHeight + 'px');
                    snippetElement.after(cm6Wrapper).hide();

                    // Capture initial value for undo
                    this._snippetBeforeEdit = this.data.snippet;
                    this._snippetChanged = false;

                    var codeEditor = new CM6.EditorView({
                        state: CM6.EditorState.create({
                            doc: snippet,
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
                                    self.data.snippet = update.state.doc.toString();
                                    self.initCodeSnippetFunction();
                                    self._snippetChanged = true;
                                    FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');
                                })
                            ]
                        }),
                        parent: cm6Wrapper[0]
                    });
                    cm6Wrapper[0]._cm6view = codeEditor;

                    this.codeEditorInstance = codeEditor;
                    this.cm6Wrapper = cm6Wrapper;


                    this.timelineElement.addClass('highlighted');


                },


                /**
                 * See also: {{#crossLink "CodeSnippet/gotIntoFocus:method"}}this.gotIntoFocus(){{/crossLink}}
                 *
                 * When I was "removed from focus" (which happens, when the CodeSnippetsController's
                 * {{#crossLink "CodeSnippetsController/codeSnippetInFocus:attribute"}}codeSnippetInFocus attribute{{/crossLink}}),
                 * is set either to null or to an other CodeSnippet than myself),
                 * then this method will be called.
                 *
                 * @method removedFromFocus
                 */
                removedFromFocus: function () {

                    var self = this;

                    // Register undo command if code was changed
                    if (this._snippetChanged && this._snippetBeforeEdit !== this.data.snippet) {
                        (function(codeSnippetId, capturedOldSnippet, capturedNewSnippet) {
                            var findCodeSnippet = function() {
                                var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;
                                for (var i = 0; i < codeSnippets.length; i++) {
                                    if (codeSnippets[i].data.created === codeSnippetId) {
                                        return codeSnippets[i];
                                    }
                                }
                                return null;
                            };
                            FrameTrail.module('UndoManager').register({
                                category: 'codeSnippets',
                                description: self.labels['SidebarCustomCode'] + ' Edit',
                                undo: function() {
                                    var codeSnippet = findCodeSnippet();
                                    if (!codeSnippet) return;
                                    codeSnippet.data.snippet = capturedOldSnippet;
                                    codeSnippet.initCodeSnippetFunction();
                                    FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');
                                },
                                redo: function() {
                                    var codeSnippet = findCodeSnippet();
                                    if (!codeSnippet) return;
                                    codeSnippet.data.snippet = capturedNewSnippet;
                                    codeSnippet.initCodeSnippetFunction();
                                    FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');
                                }
                            });
                        })(this.data.created, this._snippetBeforeEdit, this.data.snippet);
                    }

                    this._snippetBeforeEdit = null;
                    this._snippetChanged = false;

                    FrameTrail.module('ViewVideo').EditPropertiesContainer.removeClass('active').empty();
                    FrameTrail.module('ViewVideo').switchInfoTab('add');

                    this.codeEditorInstance = null;
                    this.timelineElement.removeClass('highlighted');


                }



            }


        }
    }

);
