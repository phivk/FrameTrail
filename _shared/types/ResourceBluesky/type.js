/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceBluesky.
 *
 * @class ResourceBluesky
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceBluesky',

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

                    if (this.resourceData.attributes.html) {
                        container.html(this.resourceData.attributes.html);
                    } else {
                        // Fallback: link card (no reliable direct iframe URL for Bluesky)
                        container.html(
                            '<div style="padding:16px;font-family:sans-serif;">'
                            + '<a href="' + this.resourceData.src.replace(/^\/\//, 'https://') + '" target="_blank" rel="noopener">'
                            + this.resourceData.src + '</a></div>'
                        );
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
                        + '                      <div class="resourceIcon"><span class="icon-share"></span></div>'
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
