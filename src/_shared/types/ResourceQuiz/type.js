/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourceQuiz.
 *
 * * Quiz Resources only appear in the 'Choose Custom Overlay' tab
 *   and are not listed in the ResourceManager.
 *
 * * Quiz Resources can not be used as Annotation
 *
 * @class ResourceQuiz
 * @category TypeDefinition
 * @extends Resource
 */



FrameTrail.defineType(

    'ResourceQuiz',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {
                /**
                 * I hold the data object of a custom ResourceQuiz, which is not stored in the Database and doesn't appear in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-question-circle-o',


                /**
                 * I render the content of myself, which is a &lt;div&gt; containing a quiz wrapped in a &lt;div class="resourceDetail" ...&gt;
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var self = this;

                    var licenseType = (this.resourceData.licenseType && this.resourceData.licenseType == 'CC-BY-SA-3.0') ? '<a href="https://creativecommons.org/licenses/by-sa/3.0/" title="License: '+ this.resourceData.licenseType +'" target="_blank"><span class="cc-by-sa-bg-image"></span></a>' : this.resourceData.licenseType;
                    var licenseString = (licenseType) ? licenseType +' - '+ this.resourceData.licenseAttribution : '';

                    var _rdw = document.createElement('div');
                    _rdw.innerHTML = '<div class="resourceDetail" data-type="'+ this.resourceData.type +'" style="width: 100%; height: 100%;">'
                                        +  '    <div class="resourceQuizQuestion">'+ this.resourceData.attributes.question +'</div>'
                                        +  '    <div class="resourceQuizAnswersContainer"></div>'
                                        +  '</div>';
                    var resourceDetail = _rdw.firstElementChild;

                    for (var i = 0; i < this.resourceData.attributes.answers.length; i++) {
                        var _ansbw = document.createElement('div');
                        _ansbw.innerHTML = '<button type="button">'+ this.resourceData.attributes.answers[i].text +'</button>';
                        var answerElement = _ansbw.firstElementChild;
                        answerElement.dataset.correct = String(this.resourceData.attributes.answers[i].correct);

                        resourceDetail.querySelector('.resourceQuizAnswersContainer').appendChild(answerElement);
                    }

                    resourceDetail.querySelector('.resourceQuizAnswersContainer').addEventListener('click', function(evt) {
                        var _btn = evt.target.closest('button');
                        if (!_btn) return;
                        if (_btn.dataset.correct === 'true') {
                            _btn.classList.remove('wrong'); _btn.classList.add('correct');
                            _btn.closest('.resourceDetail').classList.remove('wrong'); _btn.closest('.resourceDetail').classList.add('correct');
                            if (self.resourceData.attributes.onCorrectAnswer.showText) {
                                var _tdw = document.createElement('div');
                                _tdw.innerHTML = '<div class="textDialog">'
                                                + '    <p>'+ self.resourceData.attributes.onCorrectAnswer.showText +'</p>'
                                                + '</div>';
                                var textDialog = _tdw.firstElementChild;
                                var textDialogCtrl = Dialog({
                                    content:       textDialog,
                                    modal:         true,
                                    classes:       'quizDialog',
                                    resizable:     false,
                                    closeOnEscape: false,
                                    position:      { my: 'center', at: 'center', of: _btn.closest('.overlayContainer') },
                                    close: function() {
                                        if (self.resourceData.attributes.onCorrectAnswer.jumpForward) {
                                            FrameTrail.module('HypervideoController').currentTime = self.resourceData.attributes.onCorrectAnswer.jumpForward;
                                        }
                                        if (self.resourceData.attributes.onCorrectAnswer.resumePlayback) {
                                            FrameTrail.module('HypervideoController').play();
                                        }
                                        textDialogCtrl.destroy();
                                    },
                                    buttons: [
                                        { text: 'OK',
                                            click: function() {
                                                textDialogCtrl.close();
                                            }
                                        }
                                    ]
                                });
                            } else {
                                if (self.resourceData.attributes.onCorrectAnswer.jumpForward) {
                                    FrameTrail.module('HypervideoController').currentTime = FrameTrail.module('HypervideoController').currentTime - self.resourceData.attributes.onCorrectAnswer.jumpForward;
                                }
                                if (self.resourceData.attributes.onCorrectAnswer.resumePlayback) {
                                    FrameTrail.module('HypervideoController').play();
                                }
                            }
                        } else {
                            _btn.classList.remove('correct'); _btn.classList.add('wrong');
                            _btn.closest('.resourceDetail').classList.remove('correct'); _btn.closest('.resourceDetail').classList.add('wrong');
                            if (self.resourceData.attributes.onWrongAnswer.showText) {
                                var _sdw = document.createElement('div');
                                _sdw.innerHTML = '<div class="shareDialog">'
                                                + '    <p>'+ self.resourceData.attributes.onWrongAnswer.showText +'</p>'
                                                + '</div>';
                                var textDialog = _sdw.firstElementChild;
                                var textDialogCtrl = Dialog({
                                    content:       textDialog,
                                    modal:         true,
                                    classes:       'quizDialog',
                                    resizable:     false,
                                    closeOnEscape: false,
                                    position:      { my: 'center', at: 'center', of: _btn.closest('.overlayContainer') },
                                    close: function() {
                                        if (self.resourceData.attributes.onWrongAnswer.jumpBackward) {
                                            FrameTrail.module('HypervideoController').currentTime = FrameTrail.module('HypervideoController').currentTime - self.resourceData.attributes.onWrongAnswer.jumpBackward;
                                        }
                                        if (self.resourceData.attributes.onWrongAnswer.resumePlayback) {
                                            FrameTrail.module('HypervideoController').play();
                                        }
                                        textDialogCtrl.destroy();
                                    },
                                    buttons: [
                                        { text: 'OK',
                                            click: function() {
                                                textDialogCtrl.close();
                                            }
                                        }
                                    ]
                                });
                            } else {
                                if (self.resourceData.attributes.onWrongAnswer.jumpForward) {
                                    FrameTrail.module('HypervideoController').currentTime = self.resourceData.attributes.onWrongAnswer.jumpBackward;
                                }
                                if (self.resourceData.attributes.onWrongAnswer.resumePlayback) {
                                    FrameTrail.module('HypervideoController').play();
                                }
                            }
                        }
                    });
                    resourceDetail.insertAdjacentHTML('beforeend', '<div class="resourceOptions"><div class="licenseInformation">'+ licenseString +'</div><div class="resourceButtons"></div>');

                    return resourceDetail;

                },

                /**
                 * Several modules need me to render a thumb of myself.
                 *
                 * These thumbs have a special structure of HTMLElements, where several data-attributes carry the information needed.
                 *
                 * @method renderThumb
                 * @return thumbElement
                 */
                renderThumb: function() {

                    var self = this;

                    var tagList = (this.resourceData.tags ? this.resourceData.tags.join(' ') : '');
                    
                    var _thw = document.createElement('div');
                    _thw.innerHTML = '<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-type="'+ this.resourceData.type +'">'
                        + '                  <div class="resourceOverlay">'
                        + '                      <div class="resourceIcon"><span class="icon-question-circle-o"></span></div>'
                        + '                  </div>'
                        + '                  <div class="resourceTitle">'+ this.labels['ResourceCustomTextHTML'] +'</div>'
                        + '              </div>';
                    var thumbElement = _thw.firstElementChild;

                    var previewButton = document.createElement('div');
                    previewButton.className = 'resourcePreviewButton';
                    previewButton.innerHTML = '<span class="icon-eye"></span>';
                    previewButton.addEventListener('click', function(evt) {
                        // call the openPreview method (defined in abstract type: Resource)
                        self.openPreview( this.parentElement );
                        evt.stopPropagation();
                        evt.preventDefault();
                    });
                    thumbElement.appendChild(previewButton);

                    return thumbElement;

                },


                /**
                 * See {{#crossLink "Resource/renderBasicPropertiesControls:method"}}Resource/renderBasicPropertiesControls(){{/crossLink}}
                 * @method renderPropertiesControls
                 * @param {Overlay} overlay
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function, changeDimensions: Function &#125;
                 */
                renderPropertiesControls: function(overlay) {

                    var basicControls = this.renderBasicPropertiesControls(overlay);

                    basicControls.controlsContainer.querySelector('#OverlayOptions').prepend(this.renderQuizEditor(overlay));


                    return basicControls;

                },


                /**
                 * See {{#crossLink "Resource/renderBasicTimeControls:method"}}Resource/renderBasicTimeControls(){{/crossLink}}
                 * @method renderTimeControls
                 * @param {Annotation} annotation
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function &#125;
                 */
                renderTimeControls: function(annotation) {

                    var timeControls = this.renderBasicTimeControls(annotation);

                    timeControls.controlsContainer.querySelector('#AnnotationOptions').append(this.renderQuizEditor(annotation));

                    return timeControls;

                },


                /**
                 * I render an editor for quiz contents
                 * @method renderQuizEditor
                 * @param {Object} overlayOrAnnotation
                 * @return &#123; quizEditorContainer: HTMLElement;
                 */
                renderQuizEditor: function(overlayOrAnnotation) {

                    var self = this;
                    var currentAttributes = overlayOrAnnotation.data.attributes;
                    
                    // Capture snapshot of quiz attributes for undo
                    var quizAttributesSnapshot = JSON.parse(JSON.stringify(currentAttributes));
                    var quizChanged = false;

                    /* Add Question Text Field */
                    
                    var quizEditorContainer = document.createElement('div');
                    quizEditorContainer.className = 'quizEditorContainer';
                    
                    var questionRow = document.createElement('div');
                    questionRow.className = 'layoutRow';
                    var questionCol = document.createElement('div');
                    questionCol.className = 'column-12';
                    questionCol.insertAdjacentHTML('beforeend', '<label>'+ this.labels['SettingsQuizQuestionLabel'] +'</label>');
                    var questionText = document.createElement('input');
                    questionText.type = 'text';
                    questionText.value = currentAttributes.question;
                    
                    questionText.addEventListener('keyup', function(evt) {
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var newValue = this.value;
                            overlayOrAnnotation.data.attributes.question = newValue;

                            if (overlayOrAnnotation.overlayElement) {

                                overlayOrAnnotation.overlayElement.querySelector('.resourceQuizQuestion').innerHTML = newValue;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');

                            } else {

                                // Update annotation elements in dom
                                overlayOrAnnotation.contentViewDetailElements.forEach(function(el) {
                                    el.querySelector('.resourceQuizQuestion').innerHTML = newValue;
                                });
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');

                            }
                        }
                    });

                    questionCol.appendChild(questionText);
                    questionRow.appendChild(questionCol);
                    quizEditorContainer.appendChild(questionRow);

                    /* Add Answer Text Fields */

                    var answersRow = document.createElement('div');
                    answersRow.className = 'layoutRow';
                    var leftColumn = document.createElement('div');
                    leftColumn.className = 'column-12';

                    leftColumn.insertAdjacentHTML('beforeend', '<label>'+ this.labels['SettingsQuizAnswersLabel'] +'</label>');

                    var answersContainer = document.createElement('div');
                    answersContainer.className = 'quizEditorAnswersContainer';

                    for (var i = 0; i < currentAttributes.answers.length; i++) {
                        
                        answersContainer.appendChild(getAnswerElement(currentAttributes.answers[i].text, currentAttributes.answers[i].correct));
                        
                    }

                    function getAnswerElement(answerInput, isCorrect) {
                        if (!answerInput) {
                            answerInput = '';
                        }
                        if (!isCorrect) {
                            isCorrect = false;
                        }
                        var answerWrapper = document.createElement('div');
                        answerWrapper.className = 'answerWrapper';
                        var answerText = document.createElement('input');
                        answerText.type = 'text';
                        answerText.value = answerInput || '';
                        var _adbw = document.createElement('div');
                        _adbw.innerHTML = '<button type="button" class="answerDeleteButton"><span class="icon-cancel"></span></button>';
                        var answerDeleteButton = _adbw.firstElementChild;
                        var checkedString = (isCorrect) ? 'checked="checked"' : '';
                        var _acbw = document.createElement('div');
                        _acbw.innerHTML = '<label class="switch">'
                                        +  '    <input class="answerCheckbox" type="checkbox" autocomplete="off" '+ checkedString +'>'
                                        +  '    <span class="slider round"></span>'
                                        +  '</label>';
                        answerCheckbox = _acbw.firstElementChild;

                        answerWrapper.append(answerText, answerCheckbox, answerDeleteButton);
                        return answerWrapper;
                    }

                    answersContainer.addEventListener('keyup', function(evt) {
                        var _inp = evt.target.closest('input[type="text"]');
                        if (!_inp) return;
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var _wrapper = _inp.closest('.answerWrapper'),
                                thisIndex = Array.from(_wrapper.parentNode.children).indexOf(_wrapper),
                                newValue = _inp.value;

                            overlayOrAnnotation.data.attributes.answers[thisIndex].text = newValue;

                            if (overlayOrAnnotation.overlayElement) {
                                overlayOrAnnotation.overlayElement.querySelectorAll('.resourceQuizAnswersContainer button').forEach(function(b) { b.classList.remove('correct', 'wrong'); });
                                var _btn2 = overlayOrAnnotation.overlayElement.querySelectorAll('.resourceQuizAnswersContainer button')[thisIndex];
                                if (_btn2) _btn2.innerHTML = newValue;
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                            } else {
                                // Update annotation elements in dom
                                overlayOrAnnotation.contentViewDetailElements.forEach(function(el) {
                                    el.querySelectorAll('.resourceQuizAnswersContainer button').forEach(function(b) { b.classList.remove('correct', 'wrong'); });
                                    var _btn3 = el.querySelectorAll('.resourceQuizAnswersContainer button')[thisIndex];
                                    if (_btn3) _btn3.innerHTML = newValue;
                                });
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                            }
                        }
                    });

                    answersContainer.addEventListener('click', function(evt) {
                        var _delBtn = evt.target.closest('.answerDeleteButton');
                        if (!_delBtn) return;
                        var _wrapper = _delBtn.closest('.answerWrapper');
                        var thisIndex = Array.from(_wrapper.parentNode.children).indexOf(_wrapper);

                        overlayOrAnnotation.data.attributes.answers.splice(thisIndex, 1);

                        if (overlayOrAnnotation.overlayElement) {
                            var _btns = overlayOrAnnotation.overlayElement.querySelectorAll('.resourceQuizAnswersContainer button');
                            if (_btns[thisIndex]) _btns[thisIndex].remove();
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            // Update annotation elements in dom
                            overlayOrAnnotation.contentViewDetailElements.forEach(function(el) {
                                var _btns2 = el.querySelectorAll('.resourceQuizAnswersContainer button');
                                if (_btns2[thisIndex]) _btns2[thisIndex].remove();
                            });
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }

                        _wrapper.remove();
                    });

                    answersContainer.addEventListener('change', function(evt) {
                        var _cb = evt.target.closest('input[type="checkbox"]');
                        if (!_cb) return;
                        var _wrapper = _cb.closest('.answerWrapper');
                        var thisIndex = Array.from(_wrapper.parentNode.children).indexOf(_wrapper);

                        overlayOrAnnotation.data.attributes.answers[thisIndex].correct = _cb.checked;

                        if (overlayOrAnnotation.overlayElement) {
                            var _btns = overlayOrAnnotation.overlayElement.querySelectorAll('.resourceQuizAnswersContainer button');
                            if (_btns[thisIndex]) _btns[thisIndex].dataset.correct = String(_cb.checked);
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            // Update annotation elements in dom
                            overlayOrAnnotation.contentViewDetailElements.forEach(function(el) {
                                var _btns2 = el.querySelectorAll('.resourceQuizAnswersContainer button');
                                if (_btns2[thisIndex]) _btns2[thisIndex].dataset.correct = String(_cb.checked);
                            });
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    leftColumn.appendChild(answersContainer);

                    var _nabw = document.createElement('div');
                    _nabw.innerHTML = '<button type="button">'+ this.labels['GenericAdd'] +' <span class="icon-plus"></span></button>';
                    var newAnswerButton = _nabw.firstElementChild;
                    newAnswerButton.addEventListener('click', function() {
                        
                        overlayOrAnnotation.data.attributes.answers.push({
                            'text': '',
                            'correct': false
                        });

                        answersContainer.append(getAnswerElement());
                        var answerElement = document.createElement('button');
                        answerElement.type = 'button';
                        answerElement.dataset.correct = 'false';
                        overlayOrAnnotation.overlayElement.querySelector('.resourceQuizAnswersContainer').appendChild(answerElement);
                    });

                    leftColumn.appendChild(newAnswerButton);

                    var settingsCorrectShowTextCheckedString = (overlayOrAnnotation.data.attributes.onCorrectAnswer.showText) ? 'checked="checked"' : '',
                        settingsCorrectShowTextClass = (overlayOrAnnotation.data.attributes.onCorrectAnswer.showText) ? 'active' : '',
                        settingsCorrectShowTextValue = (overlayOrAnnotation.data.attributes.onCorrectAnswer.showText) ? overlayOrAnnotation.data.attributes.onCorrectAnswer.showText : '',
                        settingsWrongShowTextCheckedString = (overlayOrAnnotation.data.attributes.onWrongAnswer.showText) ? 'checked="checked"' : '',
                        settingsWrongShowTextClass = (overlayOrAnnotation.data.attributes.onWrongAnswer.showText) ? 'active' : '',
                        settingsWrongShowTextValue = (overlayOrAnnotation.data.attributes.onWrongAnswer.showText) ? overlayOrAnnotation.data.attributes.onWrongAnswer.showText : '',
                        settingsCorrectPlayCheckedString = (overlayOrAnnotation.data.attributes.onCorrectAnswer.resumePlayback) ? 'checked="checked"' : '',
                        settingsWrongPlayCheckedString = (overlayOrAnnotation.data.attributes.onWrongAnswer.resumePlayback) ? 'checked="checked"' : '',
                        settingsJumpForwardValue = (overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward) ? overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward : 20,
                        settingsJumpForwardCheckedString = (overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward) ? 'checked="checked"' : '',
                        settingsJumpForwardDisabledString = (overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward) ? '' : 'disabled="disabled"',
                        settingsJumpBackwardValue = (overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward) ? overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward : 20,
                        settingsJumpBackwardCheckedString = (overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward) ? 'checked="checked"' : '',
                        settingsJumpBackwardDisabledString = (overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward) ? '' : 'disabled="disabled"';

                    var settingsRow = document.createElement('div');
                    settingsRow.className = 'layoutRow';
                    var _rcw = document.createElement('div');
                    _rcw.innerHTML = '<div class="column-12">'
                                    +   '    <div class="settingsActionsTabs">'
                                    +   '        <ul>'
                                    +   '            <li>'
                                    +   '                <a href="#SettingsCorrect">'+ this.labels['SettingsActionsIfRight'] +'</a>'
                                    +   '            </li>'
                                    +   '            <li>'
                                    +   '                <a href="#SettingsWrong">'+ this.labels['SettingsActionsIfWrong'] +'</a>'
                                    +   '            </li>'
                                    +   '        </ul>'
                                    +   '        <div id="SettingsCorrect">'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsCorrectShowTextCheckbox" class="settingsCorrectShowTextCheckbox" type="checkbox" autocomplete="off" '+ settingsCorrectShowTextCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsCorrectShowTextCheckbox">'+ this.labels['GenericShowText'] +'</label>'
                                    +   '                <input type="text" class="settingsCorrectShowTextInput '+ settingsCorrectShowTextClass +'" value="'+ settingsCorrectShowTextValue +'"/>'
                                    +   '            </div>'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsJumpForwardCheckbox" class="settingsJumpForwardCheckbox" type="checkbox" autocomplete="off" '+ settingsJumpForwardCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsJumpForwardCheckbox">'+ this.labels['GenericJumpForward'] +'</label>'
                                    +   '                <input type="text" class="settingsJumpForwardInput" '+ settingsJumpForwardDisabledString +' value="'+ settingsJumpForwardValue +'"/>'
                                    +   '                <span>'+ this.labels['GenericSeconds'] +'</span>'
                                    +   '            </div>'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsCorrectPlayCheckbox" class="settingsCorrectPlayCheckbox" type="checkbox" autocomplete="off" '+ settingsCorrectPlayCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsCorrectPlayCheckbox">'+ this.labels['GenericContinuePlayback'] +'</label>'
                                    +   '            </div>'
                                    +   '            <div class="message active">'+ this.labels['MessageQuizActions'] +': '+ this.labels['GenericShowText'] +', '+ this.labels['GenericJumpForward'] +', '+ this.labels['GenericContinuePlayback'] +'.</div>'
                                    +   '        </div>'
                                    +   '        <div id="SettingsWrong">'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsWrongShowTextCheckbox" class="settingsWrongShowTextCheckbox" type="checkbox" autocomplete="off" '+ settingsWrongShowTextCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsWrongShowTextCheckbox">'+ this.labels['GenericShowText'] +'</label>'
                                    +   '                <input type="text" class="settingsWrongShowTextInput '+ settingsWrongShowTextClass +'" value="'+ settingsWrongShowTextValue +'"/>'
                                    +   '            </div>'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsJumpBackwardCheckbox" class="settingsJumpBackwardCheckbox" type="checkbox" autocomplete="off" '+ settingsJumpBackwardCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsJumpBackwardCheckbox">'+ this.labels['GenericJumpBackward'] +': </label>'
                                    +   '                <input type="text" class="settingsJumpBackwardInput" '+ settingsJumpBackwardDisabledString +' value="'+ settingsJumpBackwardValue +'"/>'
                                    +   '                <span>'+ this.labels['GenericSeconds'] +'</span>'
                                    +   '            </div>'
                                    +   '            <div class="checkboxRow">'
                                    +   '                <label class="switch">'
                                    +   '                    <input id="settingsWrongPlayCheckbox" class="settingsWrongPlayCheckbox" type="checkbox" autocomplete="off" '+ settingsWrongPlayCheckedString +'>'
                                    +   '                    <span class="slider round"></span>'
                                    +   '                </label>'
                                    +   '                <label for="settingsWrongCheckbox">'+ this.labels['GenericContinuePlayback'] +'</label>'
                                    +   '            </div>'
                                    +   '            <div class="message active">'+ this.labels['MessageQuizActions'] +': '+ this.labels['GenericShowText'] +', '+ this.labels['GenericJumpBackward'] +', '+ this.labels['GenericContinuePlayback'] +'.</div>'
                                    +   '        </div>'
                                    +   '    </div>'
                                    +   '</div>';
                    var rightColumn = _rcw.firstElementChild;

                    FTTabs(rightColumn.querySelector('.settingsActionsTabs'));

                    var settingsCorrectShowTextInput = rightColumn.querySelector('input.settingsCorrectShowTextInput');
                    settingsCorrectShowTextInput.addEventListener('keyup', function(evt) {
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var thisValue = this.value;
                            
                            overlayOrAnnotation.data.attributes.onCorrectAnswer.showText = thisValue;
                            if (overlayOrAnnotation.overlayElement) { 
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                            } else {
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                            }
                        }
                    });
                    rightColumn.querySelector('input.settingsCorrectShowTextCheckbox').addEventListener('change', function() {
                        if (!this.checked) {
                            settingsCorrectShowTextInput.value = ''; settingsCorrectShowTextInput.classList.remove('active');
                        } else {
                            settingsCorrectShowTextInput.classList.add('active');
                        }
                        overlayOrAnnotation.data.attributes.onCorrectAnswer.showText = (this.checked) ? settingsCorrectShowTextInput.value : false;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    var settingsWrongShowTextInput = rightColumn.querySelector('input.settingsWrongShowTextInput');
                    settingsWrongShowTextInput.addEventListener('keyup', function(evt) {
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var thisValue = this.value;
                            
                            overlayOrAnnotation.data.attributes.onWrongAnswer.showText = thisValue;
                            if (overlayOrAnnotation.overlayElement) { 
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                            } else {
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                            }
                        }
                    });
                    rightColumn.querySelector('input.settingsWrongShowTextCheckbox').addEventListener('change', function() {
                        if (!this.checked) {
                            settingsWrongShowTextInput.value = ''; settingsWrongShowTextInput.classList.remove('active');
                        } else {
                            settingsWrongShowTextInput.classList.add('active');
                        }
                        overlayOrAnnotation.data.attributes.onWrongAnswer.showText = (this.checked) ? settingsWrongShowTextInput.value : false;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    rightColumn.querySelector('input.settingsCorrectPlayCheckbox').addEventListener('change', function() {
                        overlayOrAnnotation.data.attributes.onCorrectAnswer.resumePlayback = this.checked;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    rightColumn.querySelector('input.settingsWrongPlayCheckbox').addEventListener('change', function() {
                        overlayOrAnnotation.data.attributes.onWrongAnswer.resumePlayback = this.checked;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    var settingsJumpForwardInput = rightColumn.querySelector('input.settingsJumpForwardInput');
                    settingsJumpForwardInput.addEventListener('keyup', function(evt) {
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var thisValue = parseFloat(this.value);
                            
                            overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward = thisValue;
                            if (overlayOrAnnotation.overlayElement) { 
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                            } else {
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                            }
                        }
                    });
                    rightColumn.querySelector('input.settingsJumpForwardCheckbox').addEventListener('change', function() {
                        if (!this.checked) {
                            settingsJumpForwardInput.disabled = true;
                        } else {
                            settingsJumpForwardInput.disabled = false;
                        }
                        overlayOrAnnotation.data.attributes.onCorrectAnswer.jumpForward = (this.checked) ? parseFloat(settingsJumpForwardInput.value) : false;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    var settingsJumpBackwardInput = rightColumn.querySelector('input.settingsJumpBackwardInput');
                    settingsJumpBackwardInput.addEventListener('keyup', function(evt) {
                        if (!evt.metaKey && evt.key != 'Meta') {
                            var thisValue = parseFloat(this.value);
                            
                            overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward = thisValue;
                            if (overlayOrAnnotation.overlayElement) { 
                                FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                            } else {
                                FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                            }
                        }
                    });
                    rightColumn.querySelector('input.settingsJumpBackwardCheckbox').addEventListener('change', function() {
                        if (!this.checked) {
                            settingsJumpBackwardInput.disabled = true;
                        } else {
                            settingsJumpBackwardInput.disabled = false;
                        }
                        overlayOrAnnotation.data.attributes.onWrongAnswer.jumpBackward = (this.checked) ? parseFloat(settingsJumpBackwardInput.value) : false;
                        if (overlayOrAnnotation.overlayElement) { 
                            FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        } else {
                            FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');
                        }
                    });

                    answersRow.appendChild(leftColumn);
                    settingsRow.appendChild(rightColumn);
                    quizEditorContainer.append(answersRow, settingsRow);

                    // Helper function to update quiz DOM elements by re-rendering
                    var updateQuizVisuals = function(el) {
                        if (el.overlayElement) {
                            // Re-render overlay content
                            var _oldRd = el.overlayElement.querySelector('.resourceDetail');
                            if (_oldRd) _oldRd.remove();
                            el.overlayElement.appendChild(el.resourceItem.renderContent());
                            //el.scaleOverlayElement();
                        } else {
                            // Re-render annotation content in all content views
                            el.contentViewDetailElements.forEach(function(detailEl) {
                                var _rd = detailEl.querySelector('.resourceDetail');
                                if (_rd) _rd.remove();
                                detailEl.appendChild(el.resourceItem.renderContent());
                            });
                        }
                    };

                    // Register undo when focus leaves the quiz editor (if changes were made)
                    quizEditorContainer.addEventListener('focusout', function(evt) {
                        // Only register if focus is leaving the container entirely
                        var newFocusTarget = evt.relatedTarget;
                        if (newFocusTarget && quizEditorContainer.contains(newFocusTarget)) {
                            return; // Focus is still within the container
                        }
                        
                        // Check if attributes changed by comparing to snapshot
                        var currentAttrs = JSON.stringify(overlayOrAnnotation.data.attributes);
                        var snapshotAttrs = JSON.stringify(quizAttributesSnapshot);
                        
                        if (currentAttrs !== snapshotAttrs) {
                            var isOverlay = !!overlayOrAnnotation.overlayElement;
                            var category = isOverlay ? 'overlays' : 'annotations';
                            var elementId = overlayOrAnnotation.data.created;
                            
                            (function(id, oldAttr, newAttr, cat, labels, updateFn) {
                                var findElement = function() {
                                    var arr = cat === 'overlays' ? 
                                        FrameTrail.module('HypervideoModel').overlays : 
                                        FrameTrail.module('HypervideoModel').annotations;
                                    for (var i = 0; i < arr.length; i++) {
                                        if (arr[i].data.created === id) {
                                            return arr[i];
                                        }
                                    }
                                    return null;
                                };
                                FrameTrail.module('UndoManager').register({
                                    category: cat,
                                    description: (cat === 'overlays' ? labels['SidebarOverlays'] : labels['SidebarMyAnnotations']) + ' Quiz',
                                    undo: function() {
                                        var el = findElement();
                                        if (!el) return;
                                        el.data.attributes = JSON.parse(oldAttr);
                                        updateFn(el);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange(cat);
                                    },
                                    redo: function() {
                                        var el = findElement();
                                        if (!el) return;
                                        el.data.attributes = JSON.parse(newAttr);
                                        updateFn(el);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange(cat);
                                    }
                                });
                            })(elementId, snapshotAttrs, currentAttrs, category, self.labels, updateQuizVisuals);
                            
                            // Update snapshot to current state
                            quizAttributesSnapshot = JSON.parse(currentAttrs);
                        }
                    });

                    return quizEditorContainer;

                }



            }



        }
    }


);
