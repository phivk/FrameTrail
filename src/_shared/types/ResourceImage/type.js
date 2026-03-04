/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourceImage. I represent a resource file of an image.
 *
 * @class ResourceImage
 * @category TypeDefinition
 * @extends Resource
 */



FrameTrail.defineType(

    'ResourceImage',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){

                this.resourceData = resourceData;

            },
            prototype: {
                /**
                 * I hold the data object of a ResourceImage, which is stored in the {{#crossLink "Database"}}Database{{/crossLink}} and saved in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-picture',


                /**
                 * I render the content of myself, which is a &lt;img&gt; wrapped in a &lt;div class="resourceDetail" ...&gt;
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var licenseType = (this.resourceData.licenseType && (this.resourceData.licenseType == 'CC-BY-SA' || this.resourceData.licenseType == 'CC-BY-SA-3.0')) ? '<a href="https://creativecommons.org/licenses/by-sa/3.0/" title="License: '+ this.resourceData.licenseType +'" target="_blank"><span class="cc-by-sa-bg-image"></span></a>' : this.resourceData.licenseType;
                    var rawAttr = this.resourceData.licenseAttribution;
                    var licenseString = (rawAttr && rawAttr.indexOf('<') !== -1)
                        ? rawAttr
                        : (licenseType ? licenseType + (rawAttr ? ' - ' + rawAttr : '') : (rawAttr || ''));

                    var downloadButton = '';
                    if (this.resourceData.licenseType != 'Copyright') {
                        downloadButton = '<a download class="button" href="'+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src) +'" data-tooltip-right="'+ this.labels['GenericDownload'] +'"><span class="icon-download"></span></a>';
                    }

                    var _wrapper = document.createElement('div');
                    _wrapper.innerHTML = '<div class="resourceDetail" data-type="'+ this.resourceData.type +'">'
                        + '<img src="'+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src) +'">'
                        + '<div class="resourceOptions">'
                        + '    <div class="licenseInformation">'+ licenseString +'</div>'
                        + '    <div class="resourceButtons">'+ downloadButton +'</div>'
                        + '</div>'
                        + '<div class="resourceTooltip"></div>'
                        + '</div>';
                    var resourceElement = _wrapper.firstElementChild;

                    if (this.resourceData.start) {
                        var jumpToTimeButton = document.createElement('button');
                        jumpToTimeButton.className = 'button btn btn-sm';
                        jumpToTimeButton.setAttribute('data-start', this.resourceData.start);
                        jumpToTimeButton.setAttribute('data-end', this.resourceData.end);
                        jumpToTimeButton.innerHTML = '<span class="icon-play-1"></span>';
                        jumpToTimeButton.addEventListener('click', function(){
                            FrameTrail.module('HypervideoController').currentTime = this.getAttribute('data-start');
                        });
                        resourceElement.querySelector('.resourceButtons').append(jumpToTimeButton);
                    }

                    return resourceElement;

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
                        trueID = FrameTrail.module('Database').getIdOfResource(self.resourceData);
                    } else {
                        trueID = id;
                    }

                    var thumbUrl = (this.resourceData.thumb ? FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.thumb)
                                    : FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src) );

                    var tagList = (this.resourceData.tags ? this.resourceData.tags.join(' ') : '');
                    
                    var _thumbWrapper = document.createElement('div');
                    _thumbWrapper.innerHTML = '<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-resourceID="'+ trueID +'" data-type="'+ this.resourceData.type +'" style="background-image:url('+ thumbUrl +');">'
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-picture"></span></div></div>'
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
