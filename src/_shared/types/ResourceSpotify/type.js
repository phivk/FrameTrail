/**
 * @module Shared
 */

/**
 * I am the type definition of a ResourceSpotify.
 *
 * @class ResourceSpotify
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(

    'ResourceSpotify',

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

                    var resourceContent = document.createElement('div');
                    resourceContent.className = 'resourceContent';

                    if (this.resourceData.attributes.html) {
                        resourceContent.innerHTML = this.resourceData.attributes.html;
                    } else {
                        // Fallback: build embed iframe from URL
                        var embedUrl = this.resourceData.src.replace(/^\/\//, 'https://').replace('open.spotify.com/', 'open.spotify.com/embed/');
                        resourceContent.innerHTML =
                            '<iframe src="' + embedUrl + '" '
                            + 'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" '
                            + 'allowfullscreen></iframe>';
                    }

                    container.appendChild(resourceContent);
                    container.appendChild(this.buildResourceOptions({}));
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
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-music"></span></div></div>'
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
