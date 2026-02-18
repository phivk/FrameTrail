/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceUrlPreview.
 * I serve as a generic fallback for platforms that don't support open embedding
 * (e.g. Instagram, Facebook) or when oEmbed requests fail.
 *
 * @class ResourceUrlPreview
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceUrlPreview',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {

                resourceData: {},

                renderContent: function() {

                    var data = this.resourceData;
                    var src = data.src.replace(/^\/\//, 'https://');

                    var domain = '';
                    try {
                        domain = new URL(src).hostname.replace('www.', '');
                    } catch(e) {
                        domain = src;
                    }

                    var platformIcons = {
                        'instagram': 'icon-link-ext',
                        'facebook': 'icon-link-ext',
                        'xtwitter': 'icon-link-ext',
                        'tiktok': 'icon-link-ext',
                        'mastodon': 'icon-link-ext',
                        'spotify': 'icon-music',
                        'reddit': 'icon-link-ext',
                        'default': 'icon-link-ext'
                    };
                    var iconClass = platformIcons[data.attributes.originalType] || platformIcons['default'];

                    var thumbStyle = data.thumb ? 'background-image: url(' + data.thumb.replace(/^\/\//, 'https://') + ')' : '';

                    var resourceDetail = $(
                            '<div class="resourceDetail resourceUrlPreview" data-type="'+ data.type +'">'
                        +   '    <div class="urlPreviewCard">'
                        +   '        <div class="urlPreviewThumb" style="' + thumbStyle + '">'
                        +   '            <div class="urlPreviewIcon"><span class="' + iconClass + '"></span></div>'
                        +   '        </div>'
                        +   '        <div class="urlPreviewContent">'
                        +   '            <div class="urlPreviewTitle">' + (data.name || 'View Content') + '</div>'
                        +   '            <div class="urlPreviewDescription">' + (data.attributes.description || '') + '</div>'
                        +   '            <div class="urlPreviewMeta">'
                        +   '                <span class="urlPreviewDomain">' + domain + '</span>'
                        +   '            </div>'
                        +   '            <a href="' + src + '" target="_blank" rel="noopener" class="urlPreviewLink">'
                        +   '                <span class="icon-link-ext"></span> Open Link'
                        +   '            </a>'
                        +   '        </div>'
                        +   '    </div>'
                        +   '</div>'
                    );

                    return resourceDetail;

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
                        + '                      <div class="resourceIcon"><span class="icon-link-ext"></span></div>'
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
