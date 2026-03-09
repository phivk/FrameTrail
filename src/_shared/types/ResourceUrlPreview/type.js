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

    'ResourceUrlpreview',

    function (FrameTrail) {

        // Track which platform embed scripts have been injected (per page load)
        var _platformScriptInjected = {};

        function _platformIconClass(originalType) {
            var icons = {
                'flickr':     'icon-picture',
                'slideshare': 'icon-link',
                'default':    'icon-link'
            };
            return icons[originalType] || icons['default'];
        }

        function _loadPlatformScript(originalType, container) {
            var alreadyInjected = _platformScriptInjected[originalType];
            if (alreadyInjected) {
                // Script already injected — trigger re-processing if API available
                if (originalType === 'xtwitter' && window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.load(container);
                }
                return;
            }
            _platformScriptInjected[originalType] = true;

            var scriptUrl = null;
            var onLoad = null;

            if (originalType === 'xtwitter') {
                scriptUrl = 'https://platform.twitter.com/widgets.js';
                onLoad = function() {
                    if (window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.load(container);
                    }
                };
            } else if (originalType === 'tiktok') {
                scriptUrl = 'https://www.tiktok.com/embed.js';
            } else if (originalType === 'reddit') {
                scriptUrl = 'https://embed.reddit.com/widgets.js';
            } else if (originalType === 'flickr') {
                scriptUrl = 'https://embedr.flickr.com/assets/client-code.js';
            }
            // bluesky, slideshare: no extra script needed

            if (scriptUrl) {
                var tag = document.createElement('script');
                tag.src = scriptUrl;
                tag.async = true;
                if (onLoad) { tag.addEventListener('load', onLoad); }
                document.head.appendChild(tag);
            }
        }

        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {

                resourceData: {},

                renderContent: function() {

                    var data = this.resourceData;
                    var attrs = data.attributes || {};
                    var src = (data.src || '').replace(/^\/\//, 'https://');

                    var container = document.createElement('div');
                    container.className = 'resourceDetail resourceUrlPreview';
                    container.dataset.type = data.type;
                    if (attrs.originalType) { container.dataset.originalType = attrs.originalType; }

                    var resourceContent = document.createElement('div');
                    resourceContent.className = 'resourceContent';
                    if (attrs.originalType) { resourceContent.dataset.originalType = attrs.originalType; }

                    // oEmbed HTML stored at creation time → render the embed
                    if (attrs.html && attrs.originalType) {
                        resourceContent.innerHTML = attrs.html;
                        _loadPlatformScript(attrs.originalType, resourceContent);
                        container.appendChild(resourceContent);
                        container.appendChild(this.buildResourceOptions({}));
                        return container;
                    }

                    // Flickr direct photo URL → render as image
                    if (attrs.originalType === 'flickr' && attrs.photoUrl) {
                        var img = document.createElement('img');
                        img.src = attrs.photoUrl;
                        img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;background:#000';
                        resourceContent.appendChild(img);
                        container.appendChild(resourceContent);
                        container.appendChild(this.buildResourceOptions({}));
                        return container;
                    }

                    // Generic card fallback
                    var domain = '';
                    try { domain = new URL(src).hostname.replace(/^www\./, ''); } catch(e) { domain = src; }

                    var thumbSrc = '';
                    if (data.thumb) {
                        thumbSrc = /^(https?:)?\/\//.test(data.thumb)
                            ? data.thumb.replace(/^\/\//, 'https://')
                            : FrameTrail.module('RouteNavigation').getResourceURL(data.thumb);
                    }

                    var iconClass = _platformIconClass(attrs.originalType);

                    var card = document.createElement('div');
                    card.className = 'resourceCard';
                    if (attrs.originalType) { card.dataset.originalType = attrs.originalType; }

                    var cardHtml = '<div class="resourceCardHeader">'
                        + '<span class="resourceCardTypeIcon"><span class="' + iconClass + '"></span></span>'
                        + '<div class="resourceCardMeta">'
                        + '<div class="resourceCardTitle">' + (data.name || domain || 'View Content') + '</div>'
                        + '<div class="resourceCardSubtitle">' + domain + '</div>'
                        + '</div>'
                        + '</div>';

                    if (thumbSrc) {
                        cardHtml += '<div class="resourceCardThumb"><img src="' + thumbSrc + '" alt=""></div>';
                    }

                    if (attrs.description) {
                        cardHtml += '<div class="resourceCardContent"><p>' + attrs.description + '</p></div>';
                    }

                    card.innerHTML = cardHtml;
                    resourceContent.appendChild(card);
                    container.appendChild(resourceContent);
                    container.appendChild(this.buildResourceOptions({ openInNewTabUrl: src }));
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
                    var originalTypeAttr = (this.resourceData.attributes && this.resourceData.attributes.originalType)
                        ? ' data-original-type="'+ this.resourceData.attributes.originalType +'"' : '';

                    var _thumbWrapper = document.createElement('div');
                    _thumbWrapper.innerHTML = '<div class="resourceThumb '+ tagList +'" data-license-type="'+ this.resourceData.licenseType +'" data-resourceID="'+ trueID +'" data-type="'+ this.resourceData.type +'"'+ originalTypeAttr +' style="'+ thumbBackground +'">'
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-link-ext"></span></div></div>'
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
