/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceSoundcloud.
 *
 * @class ResourceSoundcloud
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceSoundcloud',

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
                        container.html(
                            '<iframe width="100%" height="166" scrolling="no" frameborder="no" '
                            + 'src="https://w.soundcloud.com/player/?url=' + encodeURIComponent(this.resourceData.src.replace(/^\/\//, 'https://'))
                            + '&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false">'
                            + '</iframe>'
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
                        + '                      <div class="resourceIcon"><span class="icon-soundcloud"></span></div>'
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
