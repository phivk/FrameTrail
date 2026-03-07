/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourceWikipedia. I represent an Article from Wikipedia.org which is shown in an iframe.
 *
 * @class ResourceWikipedia
 * @category TypeDefinition
 * @extends Resource
 */



FrameTrail.defineType(

    'ResourceWikipedia',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){

                this.resourceData = resourceData;

            },
            prototype: {

                /**
                 * I hold the data object of a ResourceWikipedia, which is stored in the {{#crossLink "Database"}}Database{{/crossLink}} and saved in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-wikipedia-w',


                /**
                 * I render the content of myself, which is a &lt;iframe&gt; containing the Wikipedia.org webpage and with class="resourceDetail".
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var data = this.resourceData;
                    var src = data.src.replace(/^\/\//, 'https://');

                    // Legacy fallback: if no API data stored, use the old iframe approach
                    if (!data.attributes || !data.attributes.extract) {
                        var splitUri = src.split('://'),
                            mobileUri = 'https://' + splitUri[1].substr(0, 3) + 'm.' + splitUri[1].substr(3),
                            hash = (mobileUri.indexOf('#') != -1) ? '' : '#section_0';

                        var _wrapper = document.createElement('div');
                        _wrapper.innerHTML = '<iframe class="resourceDetail" data-type="'+ data.type +'" src="'
                            +    mobileUri + hash
                            +    '" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen>'
                            +    '</iframe>';
                        var resourceDetail = _wrapper.firstElementChild;
                        resourceDetail.addEventListener('error', function() { return true; });
                        return resourceDetail;
                    }

                    // Rich card rendering
                    var articleUrl = data.attributes.articleUrl || src;
                    var dir = data.attributes.dir || 'ltr';
                    var lang = data.attributes.wikiLang || 'en';

                    var thumbSrc = '';
                    if (data.thumb) {
                        thumbSrc = /^(https?:)?\/\//.test(data.thumb)
                            ? data.thumb
                            : FrameTrail.module('RouteNavigation').getResourceURL(data.thumb);
                    }

                    var extractHtml = data.attributes.extract_html || '<p>' + (data.attributes.extract || '') + '</p>';
                    var description = data.attributes.description || '';

                    var card = document.createElement('div');
                    card.className = 'resourceCard';

                    var cardHtml = '<div class="resourceCardHeader">'
                        + '<span class="resourceCardTypeIcon"><span class="icon-wikipedia-w"></span></span>'
                        + '<div class="resourceCardMeta">'
                        + '<div class="resourceCardTitle">' + (data.name || '') + '</div>'
                        + (description ? '<div class="resourceCardSubtitle">' + description + '</div>' : '')
                        + '</div>'
                        + '</div>';

                    if (thumbSrc) {
                        cardHtml += '<div class="resourceCardThumb"><img src="' + thumbSrc + '" alt=""></div>';
                    }

                    cardHtml += '<div class="resourceCardContent" dir="' + dir + '" lang="' + lang + '">'
                        + extractHtml
                        + '</div>';

                    cardHtml += '<div class="resourceCardFooter">'
                        + '<a href="' + articleUrl + '" target="_blank" rel="noopener">'
                        + '<span class="icon-link-ext"></span> ' + this.labels['ResourceOpenInNewTab']
                        + '</a>'
                        + '</div>';

                    card.innerHTML = cardHtml;

                    var resourceDetail = document.createElement('div');
                    resourceDetail.className = 'resourceDetail resourceWikipediaCard';
                    resourceDetail.dataset.type = data.type;
                    resourceDetail.appendChild(card);

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
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-wikipedia-w"></span></div></div>'
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
