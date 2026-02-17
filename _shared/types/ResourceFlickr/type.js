/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceFlickr.
 *
 * @class ResourceFlickr
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceFlickr',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {

                resourceData: {},

                renderContent: function() {

                    var container = $('<div class="resourceDetail" data-type="'+ this.resourceData.type +'"></div>');

                    if (this.resourceData.attributes.photoUrl) {
                        var img = $('<img src="' + this.resourceData.attributes.photoUrl + '" alt="' + this.resourceData.name + '" style="max-width: 100%; max-height: 100%; object-fit: contain;">');
                        container.append(img);
                    } else if (this.resourceData.attributes.html) {
                        container.html(this.resourceData.attributes.html);

                        if (!document.querySelector('script[src*="embedr.flickr.com"]')) {
                            var tag = document.createElement('script');
                            tag.src = 'https://embedr.flickr.com/assets/client-code.js';
                            tag.async = true;
                            tag.charset = 'utf-8';
                            document.head.appendChild(tag);
                        }
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

                    var thumbElement = $('<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-resourceID="'+ trueID +'" data-type="'+ this.resourceData.type +'" style="'+ thumbBackground +'">'
                        + '                  <div class="resourceOverlay">'
                        + '                      <div class="resourceIcon"><span class="icon-picture"></span></div>'
                        + '                  </div>'
                        + '                  <div class="resourceTitle">'+ this.resourceData.name +'</div>'
                        + '              </div>');

                    var previewButton = $('<div class="resourcePreviewButton"><span class="icon-eye"></span></div>').click(function(evt) {
                        self.openPreview( $(this).parent() );
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
