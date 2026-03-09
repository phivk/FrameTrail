/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourcePdf. I represent a PDF document.
 *
 * @class ResourcePdf
 * @category TypeDefinition
 * @extends Resource
 */



FrameTrail.defineType(

    'ResourcePdf',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){

                this.resourceData = resourceData;

            },
            prototype: {

                /**
                 * I hold the data object of a ResourcePdf, which is stored in the {{#crossLink "Database"}}Database{{/crossLink}} and saved in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-file-pdf',


                /**
                 * I render the content of myself, which is a PDF wrapped in a &lt;div class="resourceDetail" ...&gt;
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var resourceDetail = document.createElement('div');
                    resourceDetail.className = 'resourceDetail';
                    resourceDetail.dataset.type = this.resourceData.type;

                    var documentSource = (this.resourceData.src.indexOf('//') != -1) ? this.resourceData.src.replace('http:', 'https:') : FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src);

                    var resourceContent = document.createElement('div');
                    resourceContent.className = 'resourceContent';

                    var _pdfWrapper = document.createElement('div');
                    _pdfWrapper.innerHTML = '<object'
                        + ' data="'+ documentSource +'"'
                        + ' type="application/pdf"'
                        + ' width="100%"'
                        + ' height="100%">'
                        + ' <iframe webkitAllowFullScreen mozallowfullscreen allowFullScreen '
                        + ' src="'+ documentSource +'"'
                        + ' width="100%"'
                        + ' height="100%"'
                        + ' sandbox="allow-same-origin allow-scripts allow-popups allow-forms"'
                        + ' frameborder="0"'
                        + ' style="border: none;">'
                        + ' <p>Your browser does not support PDFs.'
                        + ' <a href="'+ documentSource +'">'+ this.labels['GenericDownload'] +'</a>.</p>'
                        + ' </iframe>'
                        + '</object>';
                    resourceContent.append(_pdfWrapper.firstElementChild);
                    resourceDetail.appendChild(resourceContent);

                    resourceDetail.appendChild(this.buildResourceOptions({
                        downloadUrl: documentSource,
                        licenseType: this.resourceData.licenseType,
                        licenseAttribution: this.resourceData.licenseAttribution
                    }));

                    return resourceDetail;

                },

                /**
                 * Several modules need me to render a thumb of myself.
                 *
                 * These thumbs have a special structure of HTMLElements, where several data-attributes carry the information needed by e.g. the {{#crossLink "ResourceManager"}}ResourceManager{{/crossLink}}.
                 *
                 * The id parameter is optional. If it is not passed, the Database tries to find the resource object in its storage.
                 *
                 * @method renderThumb
                 * @param {} id
                 * @return thumbElement
                 */
                renderThumb: function(id) {

                    var trueID,
                        self = this;

                    if (!id) {
                        trueID = FrameTrail.module('Database').getIdOfResource(this.resourceData);
                    } else {
                        trueID = id;
                    }

                    var thumbBackground = (this.resourceData.thumb ?
                            'background-image: url('+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.thumb) +');' : '' );

                    var tagList = (this.resourceData.tags ? this.resourceData.tags.join(' ') : '');
                    
                    var _thumbWrapper = document.createElement('div');
                    _thumbWrapper.innerHTML = '<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-resourceID="'+ trueID +'" data-type="'+ this.resourceData.type +'" style="'+ thumbBackground +'">'
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-file-pdf"></span></div></div>'
                        + '<div class="resourceTitle">'+ this.resourceData.name +'</div>'
                        + '</div>';
                    var thumbElement = _thumbWrapper.firstElementChild;

                    var previewButton = document.createElement('div');
                    previewButton.className = 'resourcePreviewButton';
                    previewButton.innerHTML = '<span class="icon-eye"></span>';
                    previewButton.addEventListener('click', function(evt) {
                        // call the openPreview method (defined in abstract type: Resource)
                        self.openPreview(this.parentElement);
                        evt.stopPropagation();
                        evt.preventDefault();
                    });
                    thumbElement.append(previewButton);

                    return thumbElement;

                },


                /**
                 * See {{#crossLink "Resource/renderBasicPropertiesControls:method"}}Resource/renderBasicPropertiesControls(){{/crossLink}}
                 * @method renderPropertiesControls
                 * @param {Overlay} overlay
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function, changeDimensions: Function &#125;
                 */
                renderPropertiesControls: function(overlay) {

                    return this.renderBasicPropertiesControls(overlay);

                },


                /**
                 * See {{#crossLink "Resource/renderBasicTimeControls:method"}}Resource/renderBasicTimeControls(){{/crossLink}}
                 * @method renderTimeControls
                 * @param {Annotation} annotation
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function &#125;
                 */
                renderTimeControls: function(annotation) {

                    return this.renderBasicTimeControls(annotation);

                }


            }



        }
    }


);
