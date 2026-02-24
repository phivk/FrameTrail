/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourceText.
 *
 * * Text Resources only appear in the 'Add Custom Overlay' tab
 *   and are not listed in the ResourceManager.
 *
 * * Text Resources can not be used as Annotation
 *
 * @class ResourceText
 * @category TypeDefinition
 * @extends Resource
 */



FrameTrail.defineType(

    'ResourceText',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {
                /**
                 * I hold the data object of a custom ResourceText, which is not stored in the Database and doesn't appear in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-doc-text',


                /**
                 * I render the content of myself, which is a &lt;div&gt; containing a custom text wrapped in a &lt;div class="resourceDetail" ...&gt;
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var self = this;

                    var licenseType = (this.resourceData.licenseType && this.resourceData.licenseType == 'CC-BY-SA-3.0') ? '<a href="https://creativecommons.org/licenses/by-sa/3.0/" title="License: '+ this.resourceData.licenseType +'" target="_blank"><span class="cc-by-sa-bg-image"></span></a>' : this.resourceData.licenseType;
                    var licenseString = (licenseType) ? licenseType +' - '+ this.resourceData.licenseAttribution : '';

                    var resourceDetail = $('<div class="resourceDetail" data-type="'+ this.resourceData.type +'" style="width: 100%; height: 100%;"></div>'),
                        unescapeHelper = document.createElement('div'),
                        child,
                        unescapedString;

                    // unescape string from json
                    unescapeHelper.innerHTML = self.resourceData.attributes.text;
                    child = unescapeHelper.childNodes[0];
                    unescapedString = child ? child.nodeValue : '';

                    resourceDetail.html(unescapedString);

                    resourceDetail.append('<div class="resourceOptions"><div class="licenseInformation">'+ licenseString +'</div><div class="resourceButtons"></div>');

                    if (this.resourceData.start) {
                        var jumpToTimeButton = $('<button class="button btn btn-sm" data-start="'+ this.resourceData.start +'" data-end="'+ this.resourceData.end +'"><span class="icon-play-1"></span></button>');
                        jumpToTimeButton.click(function(){
                            var time = $(this).attr('data-start');
                            FrameTrail.module('HypervideoController').currentTime = time;
                        });
                        resourceDetail.find('.resourceButtons').append(jumpToTimeButton);
                    }

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

                    var self = this,
                        unescapeHelper = document.createElement('div'),
                        child,
                        unescapedString;

                    var thumbBackground = (this.resourceData.thumb ?
                            "background-image: url('"+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.thumb) +"');" : "" );
                    
                    var thumbLabel = this.labels['ResourceCustomTextHTML'];
                    if (this.resourceData.name && this.resourceData.name.length > 0) {
                        thumbLabel = this.resourceData.name;
                    }

                    var tagList = (this.resourceData.tags ? this.resourceData.tags.join(' ') : '');

                    var thumbElement = $('<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-type="'+ this.resourceData.type +'" style="'+ thumbBackground +'">'
                        + '                  <div class="resourceOverlay">'
                        + '                      <div class="resourceIcon"><span class="icon-doc-text"></span></div>'
                        + '                  </div>'
                        + '                  <div class="resourceTitle">'+ thumbLabel +'</div>'
                        + '              </div>');

                    var previewButton = $('<div class="resourcePreviewButton"><span class="icon-eye"></span></div>').click(function(evt) {
                        // call the openPreview method (defined in abstract type: Resource)
                        self.openPreview( $(this).parent() );
                        evt.stopPropagation();
                        evt.preventDefault();
                    });
                    thumbElement.append(previewButton);

                    //var decoded_string = $("<div/>").html(self.resourceData.attributes.text).text();
                    //var textOnly = $("<div/>").html(decoded_string).text();
                    //thumbElement.append('<div class="resourceTextPreview">'+ textOnly +'</div>');

                    var decoded_string = $("<div/>").html(self.resourceData.attributes.text).text();
                    thumbElement.append('<div class="resourceTextPreview">'+ decoded_string +'</div>');

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

                    basicControls.controlsContainer.find('#OverlayOptions').prepend(this.renderTextEditors(overlay));


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

                    timeControls.controlsContainer.find('#AnnotationOptions').append(this.renderTextEditors(annotation));

                    return timeControls;

                },


                /**
                 * I render visual and code editors for text content
                 * @method renderTextEditors
                 * @param {Object} overlayOrAnnotation
                 * @return &#123; textContentEditorContainer: HTMLElement;
                 */
                renderTextEditors: function(overlayOrAnnotation) {

                    var self = this;
                    
                    delete window.quillEditor;
                    delete window.htmlCodeEditor;
                    delete window.oldTextContent;

                    window.oldTextContent = overlayOrAnnotation.data.attributes.text;

                    var activeFonts =     ['Arial', 'Arial Black', 'Courier', 'Courier New', 'Dosis', 'Lucida Console', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Montserrat', 'Tahoma', 'Times', 'Times New Roman', 'TitilliumWeb', 'Verdana'],
                        activeFontSizes = ['8px', '9px', '10px', '11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '20px', '22px', '26px', '28px', '30px', '32px', '34px', '36px', '38px', '40px', '46px', '50px', '60px', '70px'];

                    /* Add Panels and Text Areas */
                    
                    var textContentEditorContainer = $('<div class="textContentEditorContainer"></div>'),
                        visualEditorTab = $('<div class="textEditorTab">'+ this.labels['SettingsVisualEditor'] +' (beta)</div>'),
                        htmlEditorTab = $('<div class="textEditorTab">'+ this.labels['SettingsHTMLEditor'] +'</div>'),
                        visualEditorContent = $('<div class="textEditorContent visualEditorContent"></div>'),
                        htmlEditorContent = $('<div class="textEditorContent htmlEditorContent"></div>');

                    visualEditorTab.click(function() {
                        htmlEditorTab.removeClass('active');
                        htmlEditorContent.hide();
                        $(this).addClass('active');
                        visualEditorContent.show();
                    });
                    visualEditorTab.click();

                    htmlEditorTab.click(function() {
                        visualEditorTab.removeClass('active');
                        visualEditorContent.hide();
                        $(this).addClass('active');
                        htmlEditorContent.show();
                        if (window.htmlCodeEditor) {
                            window.htmlCodeEditor.requestMeasure();

                            try {
                                if (TogetherJS && TogetherJS.running) {
                                    TogetherJS.reinitialize();
                                }
                            } catch (e) {}

                        }
                    });

                    textContentEditorContainer.append(visualEditorTab, htmlEditorTab, visualEditorContent, htmlEditorContent);

                    var textarea = $('<textarea>' + overlayOrAnnotation.data.attributes.text + '</textarea>');
                    htmlEditorContent.append(textarea);

                    var visualEditorWrapper = $('<div class="visualEditorWrapper"></div>');
                    visualEditorContent.append(visualEditorWrapper);

                    //textEditor.style.display = 'none';

                    /* Init CodeMirror 6 for Custom HTML */

                    var CM6 = window.FrameTrailCM6;
                    var htmlCm6Wrapper = $('<div class="cm6-wrapper" style="height: 100%;"></div>');
                    textarea.after(htmlCm6Wrapper).hide();

                    var delayTimer;
                    var textBeforeEdit = overlayOrAnnotation.data.attributes.text || '';
                    var textChanged = false;

                    window.htmlCodeEditor = new CM6.EditorView({
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
                                CM6.StreamLanguage.define(CM6.legacyModes.html),
                                window.FrameTrailCM6Linters.html,
                                CM6.lintGutter(),
                                CM6.EditorView.domEventHandlers({
                                    focus: function() {
                                        textBeforeEdit = overlayOrAnnotation.data.attributes.text || '';
                                        textChanged = false;
                                    },
                                    blur: function(evt, view) {
                                        var newText = overlayOrAnnotation.data.attributes.text || '';
                                        if (textChanged && textBeforeEdit !== newText) {
                                            var isOverlay = !!overlayOrAnnotation.overlayElement;
                                            var category = isOverlay ? 'overlays' : 'annotations';
                                            var elementId = overlayOrAnnotation.data.created;
                                            (function(id, oldText, newTxt, cat, labels) {
                                                var findElement = function() {
                                                    var arr = cat === 'overlays' ?
                                                        FrameTrail.module('HypervideoModel').overlays :
                                                        FrameTrail.module('HypervideoModel').annotations;
                                                    for (var i = 0; i < arr.length; i++) {
                                                        if (arr[i].data.created === id) { return arr[i]; }
                                                    }
                                                    return null;
                                                };
                                                FrameTrail.module('UndoManager').register({
                                                    category: cat,
                                                    description: (cat === 'overlays' ? labels['SidebarOverlays'] : labels['SidebarMyAnnotations']) + ' Text',
                                                    undo: function() {
                                                        var el = findElement();
                                                        if (!el) return;
                                                        el.data.attributes.text = oldText;
                                                        FrameTrail.module('HypervideoModel').newUnsavedChange(cat);
                                                    },
                                                    redo: function() {
                                                        var el = findElement();
                                                        if (!el) return;
                                                        el.data.attributes.text = newTxt;
                                                        FrameTrail.module('HypervideoModel').newUnsavedChange(cat);
                                                    }
                                                });
                                            })(elementId, textBeforeEdit, newText, category, self.labels);
                                        }
                                        textBeforeEdit = null;
                                        textChanged = false;
                                    }
                                }),
                                CM6.EditorView.updateListener.of(function(update) {
                                    if (!update.docChanged) { return; }

                                    var isSetter = update.transactions.some(function(tr) {
                                        return tr.annotation(CM6.Transaction.userEvent) === 'setValue';
                                    });

                                    var newHtml = update.state.doc.toString();
                                    textChanged = true;

                                    if (window.quillEditor && !isSetter) {
                                        window.quillEditor.clipboard.dangerouslyPasteHTML(newHtml);
                                    }

                                    var escapeHelper = document.createElement('div');
                                    escapeHelper.appendChild(document.createTextNode(newHtml));
                                    var escapedHtml = escapeHelper.innerHTML;
                                    overlayOrAnnotation.data.attributes.text = escapedHtml;

                                    if (overlayOrAnnotation.overlayElement) {

                                        overlayOrAnnotation.overlayElement.children('.resourceDetail').html(newHtml);
                                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');

                                        if (window.oldTextContent != overlayOrAnnotation.data.attributes.text) {
                                            clearTimeout(delayTimer);
                                            delayTimer = setTimeout(function() {
                                                FrameTrail.triggerEvent('userAction', {
                                                    action: 'OverlayChange',
                                                    overlay: overlayOrAnnotation.data,
                                                    changes: [{ property: 'attributes.text', oldValue: window.oldTextContent, newValue: overlayOrAnnotation.data.attributes.text }]
                                                });
                                                window.oldTextContent = overlayOrAnnotation.data.attributes.text;
                                            }, 3000);
                                        }

                                    } else {

                                        FrameTrail.module('HypervideoModel').newUnsavedChange('annotations');

                                        if (window.oldTextContent != overlayOrAnnotation.data.attributes.text) {
                                            clearTimeout(delayTimer);
                                            delayTimer = setTimeout(function() {
                                                $(overlayOrAnnotation.contentViewDetailElements).each(function() {
                                                    $(this).find('.resourceDetail').html(newHtml);
                                                });
                                                $(overlayOrAnnotation.contentViewElements).each(function() {
                                                    $(this).find('.resourceThumb .resourceTextPreview').html(newHtml);
                                                });
                                                overlayOrAnnotation.timelineElement.find('.previewWrapper .resourceTextPreview').html(newHtml);
                                                $(FrameTrail.getState('target')).find('.editPropertiesContainer .resourceTextPreview').html(newHtml);
                                                FrameTrail.triggerEvent('userAction', {
                                                    action: 'AnnotationChange',
                                                    annotation: overlayOrAnnotation.data,
                                                    changes: [{ property: 'attributes.text', oldValue: window.oldTextContent, newValue: overlayOrAnnotation.data.attributes.text }]
                                                });
                                                window.oldTextContent = overlayOrAnnotation.data.attributes.text;
                                            }, 3000);
                                        }

                                    }
                                })
                            ]
                        }),
                        parent: htmlCm6Wrapper[0]
                    });
                    htmlCm6Wrapper[0]._cm6view = window.htmlCodeEditor;

                    /* Init Quill Visual Editor */

                    // Register style-based attributors once (inline styles, not CSS classes)
                    if (!Quill._ftFormatsRegistered) {
                        var FontAttributor = Quill.import('attributors/style/font');
                        if (FontAttributor) {
                            FontAttributor.whitelist = activeFonts;
                            Quill.register(FontAttributor, true);
                        }

                        var SizeAttributor = Quill.import('attributors/style/size');
                        if (SizeAttributor) {
                            SizeAttributor.whitelist = activeFontSizes;
                            Quill.register(SizeAttributor, true);
                        }

                        var AlignStyle = Quill.import('attributors/style/align');
                        if (AlignStyle) {
                            Quill.register(AlignStyle, true);
                        }

                        Quill._ftFormatsRegistered = true;
                    }

                    var toolbarOptions = [
                        [{ 'font': activeFonts }],
                        [{ 'size': activeFontSizes }],
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                        [{ 'align': [] }]
                    ];

                    var quillContainer = $('<div class="quillEditorContainer"></div>');
                    visualEditorWrapper.append(quillContainer);

                    window.quillEditor = new Quill(quillContainer[0], {
                        modules: { toolbar: toolbarOptions },
                        theme: 'snow'
                    });

                    // Set initial content — text is stored HTML-escaped, so decode first
                    // (same unescape pattern as renderContent)
                    var quillInitHelper = document.createElement('div');
                    quillInitHelper.innerHTML = overlayOrAnnotation.data.attributes.text || '';
                    window.quillEditor.clipboard.dangerouslyPasteHTML(
                        quillInitHelper.textContent || ''
                    );

                    // Quill → CodeMirror 6 sync
                    window.quillEditor.on('text-change', function(delta, oldDelta, source) {
                        if (source === 'user' && window.htmlCodeEditor) {
                            var doc = window.htmlCodeEditor.state.doc;
                            window.htmlCodeEditor.dispatch({
                                changes: { from: 0, to: doc.length, insert: window.quillEditor.root.innerHTML },
                                annotations: CM6.Transaction.userEvent.of('setValue')
                            });
                        }
                    });


                    return textContentEditorContainer;

                },

                getDisplayLabel: function() {
                    if (this.resourceData.attributes && this.resourceData.attributes.text) {
                        var decoded = $("<div/>").html(this.resourceData.attributes.text).text();
                        return decoded.substring(0, 50) || this.resourceData.name || 'Text';
                    }
                    return this.resourceData.name || 'Text';
                }



            }



        }
    }


);
