/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceTiktok.
 *
 * @class ResourceTiktok
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceTiktok',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {

                resourceData: {},

                renderContent: function() {

                    var container = document.createElement('div');
                    container.className = 'resourceDetail';
                    container.dataset.type = this.resourceData.type;

                    if (this.resourceData.attributes.html) {
                        container.innerHTML = this.resourceData.attributes.html;
                    }

                    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
                        var tag = document.createElement('script');
                        tag.src = 'https://www.tiktok.com/embed.js';
                        tag.async = true;
                        document.head.appendChild(tag);
                    }

                    return container;

                },

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
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-play"></span></div></div>'
                        + '<div class="resourceTitle">'+ this.resourceData.name +'</div>'
                        + '</div>';
                    var thumbElement = _thumbWrapper.firstElementChild;

                    var previewButton = document.createElement('div');
                    previewButton.className = 'resourcePreviewButton';
                    previewButton.innerHTML = '<span class="icon-eye"></span>';
                    previewButton.addEventListener('click', function(evt) {
                        self.openPreview(this.parentElement);
                        evt.stopPropagation();
                        evt.preventDefault();
                    });
                    thumbElement.append(previewButton);

                    return thumbElement;

                },

                renderPropertiesControls: function(overlay) {
                    return this.renderBasicPropertiesControls(overlay);
                },

                renderTimeControls: function(annotation) {
                    return this.renderBasicTimeControls(annotation);
                }

            }
        }
    }

);
