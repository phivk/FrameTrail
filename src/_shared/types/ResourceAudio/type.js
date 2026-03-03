/**
 * @module Shared
 */


/**
 * I am the type definition of a ResourceAudio. I represent a audio file resource on the server.
 *
 * @class ResourceAudio
 * @category TypeDefinition
 * @extends Resource
 */


FrameTrail.defineType(

    'ResourceAudio',

    function (FrameTrail) {
        return {
            parent: 'Resource',
            constructor: function(resourceData){
                this.resourceData = resourceData;
            },
            prototype: {

                /**
                 * I hold the data object of a ResourceAudio, which is stored in the {{#crossLink "Database"}}Database{{/crossLink}} and saved in the resource's _index.json.
                 * @attribute resourceData
                 * @type {}
                 */
                resourceData:   {},
                iconClass:      'icon-volume-up',


                /**
                 * I render the content of myself, which is a &lt;audio&gt; wrapped in a &lt;div class="resourceDetail" ...&gt;
                 *
                 * @method renderContent
                 * @return HTMLElement
                 */
                renderContent: function() {

                    var licenseType = (this.resourceData.licenseType && (this.resourceData.licenseType == 'CC-BY-SA' || this.resourceData.licenseType == 'CC-BY-SA-3.0')) ? '<a href="https://creativecommons.org/licenses/by-sa/3.0/" title="License: '+ this.resourceData.licenseType +'" target="_blank"><span class="cc-by-sa-bg-image"></span></a>' : this.resourceData.licenseType;
                    var licenseString = (licenseType) ? licenseType +' - '+ this.resourceData.licenseAttribution : '';

                    var downloadButton = '';
                    if (this.resourceData.licenseType != 'Copyright') {
                        downloadButton = '<a download class="button" href="'+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src) +'" data-tooltip-bottom-right="'+ this.labels['GenericDownload'] +'"><span class="icon-download"></span></a>';
                    }

                    var _wrapper = document.createElement('div');
                    _wrapper.innerHTML = '<div class="resourceDetail" data-type="'+ this.resourceData.type +'">'
                        + '<audio controls autobuffer>'
                        + '    <source src="'+ FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.src) +'" type="audio/mp3">'
                        + '</audio>'
                        + '<div class="resourceOptions">'
                        + '    <div class="licenseInformation">'+ licenseString +'</div>'
                        + '    <div class="resourceButtons">'+ downloadButton +'</div>'
                        + '</div>'
                        + '</div>';
                    var resourceDetail = _wrapper.firstElementChild;

                    if (this.resourceData.start) {
                        var jumpToTimeButton = document.createElement('button');
                        jumpToTimeButton.className = 'button btn btn-sm';
                        jumpToTimeButton.setAttribute('data-start', this.resourceData.start);
                        jumpToTimeButton.setAttribute('data-end', this.resourceData.end);
                        jumpToTimeButton.innerHTML = '<span class="icon-play-1"></span>';
                        jumpToTimeButton.addEventListener('click', function(){
                            FrameTrail.module('HypervideoController').currentTime = this.getAttribute('data-start');
                        });
                        resourceDetail.querySelector('.resourceButtons').append(jumpToTimeButton);
                    }

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
                        + '<div class="resourceOverlay"><div class="resourceIcon"><span class="icon-volume-up"></span></div></div>'
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
                 * See also {{#crossLink "Resource/renderBasicPropertiesControls:method"}}Resource/renderBasicPropertiesControls(){{/crossLink}}
                 *
                 * I extend the PropertiesControls user interface element with special controls for an audio overlay.
                 * This special control is an radio button chooser, to choose, wether the audio overlay should be synchronized with the main video.
                 *
                 * @method renderPropertiesControls
                 * @param {Overlay} overlay
                 * @return &#123; controlsContainer: HTMLElement, changeStart: Function, changeEnd: Function, changeDimensions: Function &#125;
                 */
                renderPropertiesControls: function(overlay) {

                    var basicControls = this.renderBasicPropertiesControls(overlay);

                    /* Add Audio Type  Controls */

                    var checkboxRow = document.createElement('div');
                    checkboxRow.className = 'checkboxRow';

                    var syncedLabel = document.createElement('label');
                    syncedLabel.setAttribute('for', 'syncedCheckbox');
                    syncedLabel.textContent = this.labels['SettingsSynchronization'];

                    var _switchWrapper = document.createElement('div');
                    _switchWrapper.innerHTML = '<label class="switch">'
                        + '    <input id="syncedCheckbox" class="syncedCheckbox" type="checkbox" autocomplete="off" '+ ((overlay.data.attributes.autoPlay) ? 'checked' : '') +'>'
                        + '    <span class="slider round"></span>'
                        + '</label>';
                    var syncedCheckbox = _switchWrapper.firstElementChild;

                    var self = this;
                    syncedCheckbox.querySelector('input[type="checkbox"]').addEventListener('change', function () {
                        var wasChecked = !this.checked; // opposite of current state
                        if (this.checked) {
                            overlay.data.attributes.autoPlay = true;
                            overlay.syncedMedia = true;
                            overlay.setSyncedMedia(true);
                        } else {
                            overlay.data.attributes.autoPlay = false;
                            overlay.syncedMedia = false;
                            overlay.setSyncedMedia(false);
                        }

                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                        
                        // Register undo for autoPlay toggle
                        (function(overlayId, oldVal, newVal, labels) {
                            var findOverlay = function() {
                                var overlays = FrameTrail.module('HypervideoModel').overlays;
                                for (var i = 0; i < overlays.length; i++) {
                                    if (overlays[i].data.created === overlayId) {
                                        return overlays[i];
                                    }
                                }
                                return null;
                            };
                            FrameTrail.module('UndoManager').register({
                                category: 'overlays',
                                description: labels['SidebarOverlays'] + ' ' + labels['SettingsSynchronization'],
                                undo: function() {
                                    var o = findOverlay();
                                    if (!o) return;
                                    o.data.attributes.autoPlay = oldVal;
                                    o.syncedMedia = oldVal;
                                    o.setSyncedMedia(oldVal);
                                    FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                },
                                redo: function() {
                                    var o = findOverlay();
                                    if (!o) return;
                                    o.data.attributes.autoPlay = newVal;
                                    o.syncedMedia = newVal;
                                    o.setSyncedMedia(newVal);
                                    FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                                }
                            });
                        })(overlay.data.created, wasChecked, this.checked, self.labels);
                    });

                    checkboxRow.append(syncedCheckbox, syncedLabel);

                    basicControls.controlsContainer.querySelector('#OverlayOptions').prepend(checkboxRow);

                    return basicControls;

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
