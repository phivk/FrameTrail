/**
 * @module Shared
 */


/**
 * I am the ViewResources. I render an user interface which allows the user to add, edit and delete all types of resources which are stored on the server.
 *
 * @class ViewResources
 * @static
 */



FrameTrail.defineModule('ViewResources', function(FrameTrail){

	var labels = FrameTrail.module('Localization').labels;

    var _vrWrapper = document.createElement('div');
    _vrWrapper.innerHTML = '<div class="viewResources" title="'+ labels['ResourcesManage'] +'">'
                        +  '    <div class="resourcesControls">'
                        +  '        <button class="resourceUpload"><span class="icon-doc-new"></span>'+ labels['GenericAddNew'] +'</button>'
                        +  '        <button class="resourceDelete"><span class="icon-trash"></span>'+ labels['GenericDelete'] +'</button>'
                        +  '        <button class="resourceDeleteConfirm">'+ labels['GenericConfirmDelete'] +'</button>'
                        +  '        <div class="viewControls">'
                        +  '            <button class="viewToggle" data-view="grid-medium" title="Grid View"><span class="icon-th"></span></button>'
                        +  '            <button class="viewToggle" data-view="list" title="List View"><span class="icon-list"></span></button>'
                        +  '        </div>'
                        +  '        <div class="message"></div>'
                        +  '        <div style="clear: both;"></div>'
                        +  '    </div>'
                        +  '    <div class="resourcesFilter">'
                        +  '        <div class="custom-select"><select name="ResourceFilterType">'
                        +  '            <option value="ALL">'+ labels['ResourceTypesAll'] +'</option>'
                        +  '            <option value="video">'+ labels['ResourceTypeVideo'] +'</option>'
                        +  '            <option value="image">'+ labels['ResourceTypeImage'] +'</option>'
                        +  '            <option value="pdf">'+ labels['ResourceTypePDF'] +'</option>'
                        +  '            <option value="audio">'+ labels['ResourceTypeAudio'] +'</option>'
                        +  '            <option value="webpage">'+ labels['ResourceTypeWebpage'] +'</option>'
                        +  '            <option value="location">'+ labels['ResourceTypeLocation'] +'</option>'
                        +  '            <option value="wikipedia">'+ labels['ResourceTypeWikipedia'] +'</option>'
                        +  '            <option value="youtube">'+ labels['ResourceTypeYoutube'] +'</option>'
                        +  '            <option value="vimeo">'+ labels['ResourceTypeVimeo'] +'</option>'

                        +  '            <option value="wistia">'+ labels['ResourceTypeWistia'] +'</option>'
                        +  '            <option value="soundcloud">'+ labels['ResourceTypeSoundcloud'] +'</option>'
                        +  '            <option value="twitch">'+ labels['ResourceTypeTwitch'] +'</option>'
                        +  '            <option value="bluesky">'+ labels['ResourceTypeBluesky'] +'</option>'
                        +  '            <option value="codepen">'+ labels['ResourceTypeCodepen'] +'</option>'
                        +  '            <option value="figma">'+ labels['ResourceTypeFigma'] +'</option>'
                        +  '            <option value="loom">'+ labels['ResourceTypeLoom'] +'</option>'
                        +  '            <option value="urlpreview">'+ labels['ResourceTypeUrlPreview'] +'</option>'
                        +  '            <option value="xtwitter">'+ labels['ResourceTypeXTwitter'] +'</option>'
                        +  '            <option value="tiktok">'+ labels['ResourceTypeTiktok'] +'</option>'
                        +  '            <option value="mastodon">'+ labels['ResourceTypeMastodon'] +'</option>'
                        +  '            <option value="spotify">'+ labels['ResourceTypeSpotify'] +'</option>'
                        +  '            <option value="slideshare">'+ labels['ResourceTypeSlideshare'] +'</option>'
                        +  '            <option value="reddit">'+ labels['ResourceTypeReddit'] +'</option>'
                        +  '            <option value="flickr">'+ labels['ResourceTypeFlickr'] +'</option>'
                        +  '        </select></div>'
                        +  '        <div class="resourcesCheckboxes">'
                        +  '            <input type="checkbox" id="onlyCC" name="onlyCC" /><label for="onlyCC">'+ labels['ResourceTypesOnlyCC'] +'</label>'
                        +  '        </div>'
                        +  '    </div>'
                        +  '    <div class="resourcesList view-grid-medium"></div>'
                        +  '</div>';
    var domElement = _vrWrapper.firstElementChild,

        ResourcesControls      = domElement.querySelector('.resourcesControls'),
        ResourcesFilter        = domElement.querySelector('.resourcesFilter'),
        ResourcesList          = domElement.querySelector('.resourcesList'),
        ResourceUpload         = domElement.querySelector('.resourceUpload'),
        ResourceDelete         = domElement.querySelector('.resourceDelete'),
        ResourceDeleteConfirm  = domElement.querySelector('.resourceDeleteConfirm'),

        deleteActive     = false,
        _thumbClickHandler = null,

        callback,
        showAsDialog,
        viewResourcesDialog;



    ResourceUpload.addEventListener('click', function(){
        FrameTrail.module('ResourceManager').uploadResource(updateList);
    });

    ResourceDelete.addEventListener('click', toggleDeleteMode);

    ResourceDeleteConfirm.style.display = 'none';
    ResourceDeleteConfirm.addEventListener('click', function(){
        executeDelete();
    });

    domElement.querySelector('select[name=ResourceFilterType]').addEventListener('change', updateList);

    domElement.querySelector('input[name=onlyCC]').addEventListener('change', function (evt) {
     if (this.checked) {
        ResourcesList.classList.add('onlyCC');
     } else {
        ResourcesList.classList.remove('onlyCC');
     }
    });

    // View toggle functionality
    domElement.querySelectorAll('.viewToggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var viewMode = this.dataset.view;

            // Remove all view classes
            ResourcesList.classList.remove('view-grid-small', 'view-grid-medium', 'view-grid-large', 'view-list');

            // Add selected view class
            ResourcesList.classList.add('view-' + viewMode);

            // Update active state on buttons
            domElement.querySelectorAll('.viewToggle').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // Set initial active state for grid view button
    domElement.querySelector('.viewToggle[data-view="grid-medium"]').classList.add('active');





    /**
     * I am called during init process. I prepare the DOM element and append it to the div with the id #MainContainer.
     * My parameter indicates, wether I should be shown in a jqueryUI dialog (for embbed use) or wether I am a "fullscreen" element
     * for use in a stand-alone environment.
     * @method create
     * @param {String} withoutDialog
     */
    function create(withoutDialog) {

        showAsDialog = ! withoutDialog;

        if (showAsDialog) {

            viewResourcesDialog = Dialog({
                title:    labels['ResourcesManage'],
                content:  domElement,
                autoOpen: false,
                width:    954,
                height:   600,
                modal:    true,
                close: function() {
                    callback && callback.call();
                }
            });

        } else {
            
            var wrapperElem = document.createElement('div');
            wrapperElem.className = 'resourceManagerContent';
            wrapperElem.append(domElement);
            document.querySelector(FrameTrail.getState('target')).querySelector('.mainContainer').append(wrapperElem);
        }

        FrameTrail.changeState('viewSize', FrameTrail.getState('viewSize'));

    };


    /**
     * I render the list of resource items. I check the radio boxes for the type of resources which shall be shown and call
     * {{#crossLink "ResourceManager/renderList:method"}}ResourceManager/renderList(){{/crossLink}}).
     * @method updateList
     * @return
     */
    function updateList() {

        var type = domElement.querySelector('select[name=ResourceFilterType]').value;

        if (type === 'ALL') {

            FrameTrail.module('ResourceManager').renderList(ResourcesList, false);

        } else {

            FrameTrail.module('ResourceManager').renderList(ResourcesList, true,
                'type',
                'contains',
                type
            );

        }

    }

    /**
     * I activate or deactivate the delete functionality, according to the module variable deleteActive {Boolean}.
     *
     * When "delete" is active, the resources' thumbs are selectable for deletion, and a "Confirm deletion" button appears.
     *
     * @method toggleDeleteMode
     */
    function toggleDeleteMode() {

        if (deleteActive) {

            ResourceDelete.innerHTML = '<span class="icon-trash"></span>'+ labels['GenericDelete'];
            ResourceDelete.classList.remove('active');
            ResourceDeleteConfirm.style.display = 'none';
            ResourcesList.querySelectorAll('.resourceThumb').forEach(function(t) { t.classList.remove('markedForDeletion'); });
            ResourcesList.removeEventListener('click', _thumbClickHandler);
            deleteActive = false;

            ResourcesControls.querySelector('.message').textContent = '';
            ResourcesControls.querySelector('.message').classList.remove('active');

        } else {

            ResourceDelete.textContent = labels['GenericCancel'];
            ResourceDelete.classList.add('active');
            ResourceDeleteConfirm.style.display = '';
            _thumbClickHandler = function(evt) {
                var thumb = evt.target.closest('.resourceThumb');
                if (thumb) { thumb.classList.toggle('markedForDeletion'); }
            };
            ResourcesList.addEventListener('click', _thumbClickHandler);
            deleteActive = true;

            ResourcesControls.querySelector('.message').textContent = labels['MessageSelectResourcesToDelete'];
            ResourcesControls.querySelector('.message').classList.remove('error');
            ResourcesControls.querySelector('.message').classList.add('active');

        }

    }

    /**
     * I execute the deletion of all resources selected by the user.
     * @method executeDelete
     */
    function executeDelete() {

        FrameTrail.module('UserManagement').ensureAuthenticated(function(){

            ResourcesControls.querySelector('.message').textContent = '';
            ResourcesControls.querySelector('.message').classList.remove('active');

            var deleteCollection   = [],
                callbackCollection = [];
            ResourcesList.querySelectorAll('.resourceThumb.markedForDeletion').forEach(function(t){
                deleteCollection.push(t.getAttribute('data-resourceid'));
            });

            for (var i in deleteCollection) {
                FrameTrail.module('ResourceManager').deleteResource(
                    deleteCollection[i],
                    function(){
                        callbackCollection.push(true);
                        deletionFinished();
                    },
                    function(data){
                        ResourcesControls.querySelector('.message').classList.add('error', 'active');
                        ResourcesControls.querySelector('.message').textContent = data.string;
                        callbackCollection.push(false);
                        deletionFinished();
                    }
                );

            }


            function deletionFinished() {

                if (callbackCollection.length !== deleteCollection.length) return;

                // delete finished;
                // callbackCollection contains true/false for success/fail

                if (callbackCollection[0] == true) {
                    updateList();
				    toggleDeleteMode();
                }

            }

        });

    }




    /**
     * I update the disabled state of the upload and delete buttons based on whether saving is allowed.
     * @method updateButtonStates
     */
    function updateButtonStates() {
        var canSave = FrameTrail.module('StorageManager').canSave();
        ResourceUpload.disabled = !canSave;
        ResourceDelete.disabled = !canSave;
    }


    /**
     * I show the DOM element to the user and (optionally) set a callback, when I was opened not as a stand-alone element, but inside a jQuery UI dialog.
     * @method open
     * @param {Function} closeCallback
     */
    function open(closeCallback) {

        updateButtonStates();
        updateList();

        if (showAsDialog) {
            callback = closeCallback;
            viewResourcesDialog.open();
        } else {
            domElement.removeAttribute('title');
        }

        FrameTrail.changeState('viewSize', FrameTrail.getState('viewSize'));




    }


    /**
     * I react to a change in the global state "viewSize"
     * @method changeViewSize
     * @param {Array} arrayWidthAndHeight
     */
    function changeViewSize(arrayWidthAndHeight) {

        

    }







   	return {

   		onChange: {
            viewSize: changeViewSize,
            loggedIn: updateButtonStates
        },

   		create: create,
        open: open

   	};

});
