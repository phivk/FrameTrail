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
                        +  '            <option value="wikipedia">Wikipedia</option>'
                        +  '            <option value="youtube">Youtube</option>'
                        +  '            <option value="vimeo">Vimeo</option>'

                        +  '            <option value="wistia">Wistia</option>'
                        +  '            <option value="soundcloud">SoundCloud</option>'
                        +  '            <option value="twitch">Twitch</option>'
                        +  '            <option value="bluesky">Bluesky</option>'
                        +  '            <option value="codepen">CodePen</option>'
                        +  '            <option value="figma">Figma</option>'
                        +  '            <option value="loom">Loom</option>'
                        +  '            <option value="urlpreview">'+ labels['ResourceTypeUrlPreview'] +'</option>'
                        +  '            <option value="xtwitter">X / Twitter</option>'
                        +  '            <option value="tiktok">TikTok</option>'
                        +  '            <option value="mastodon">Mastodon</option>'
                        +  '            <option value="spotify">Spotify</option>'
                        +  '            <option value="slideshare">SlideShare</option>'
                        +  '            <option value="reddit">Reddit</option>'
                        +  '            <option value="flickr">Flickr</option>'
                        +  '        </select></div>'
                        +  '        <div class="custom-select"><select name="ResourceFilterLicense">'
                        +  '            <option value="">'+ labels['ResourceLicensesAll'] +'</option>'
                        +  '            <option value="Copyright">Copyright</option>'
                        +  '            <option value="CC-BY">CC BY</option>'
                        +  '            <option value="CC-BY-SA">CC BY-SA</option>'
                        +  '            <option value="CC-BY-ND">CC BY-ND</option>'
                        +  '            <option value="CC-BY-NC">CC BY-NC</option>'
                        +  '            <option value="CC-BY-NC-SA">CC BY-NC-SA</option>'
                        +  '            <option value="CC-BY-NC-ND">CC BY-NC-ND</option>'
                        +  '            <option value="CC0">CC0 / Public Domain</option>'
                        +  '        </select></div>'
                        +  '    </div>'
                        +  '    <div class="resourcesList view-grid-medium"></div>'
                        +  '</div>';
    var domElement = _vrWrapper.firstElementChild,

        ResourcesFilter        = domElement.querySelector('.resourcesFilter'),
        ResourcesList          = domElement.querySelector('.resourcesList'),
        ResourceUpload         = domElement.querySelector('.resourceUpload'),
        StatusMessage          = domElement.querySelector('.resourcesControls .message'),

        callback,
        showAsDialog,
        viewResourcesDialog;

    function showStatusMessage(text) {
        StatusMessage.textContent = text;
        StatusMessage.classList.add('active', 'success');
        setTimeout(function() { StatusMessage.classList.remove('active', 'success'); }, 2500);
    }



    ResourceUpload.addEventListener('click', function(){
        FrameTrail.module('ResourceManager').uploadResource(updateList);
    });

    domElement.querySelector('select[name=ResourceFilterType]').addEventListener('change', updateList);

    domElement.querySelector('select[name=ResourceFilterLicense]').addEventListener('change', function () {
        var val = this.value;
        if (val === '') {
            ResourcesList.removeAttribute('data-filter-license');
        } else {
            ResourcesList.setAttribute('data-filter-license', val);
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

    // Delegated click handler for per-resource edit buttons
    ResourcesList.addEventListener('click', function(e) {
        var editBtn = e.target.closest('.resourceEditButton');
        if (!editBtn) { return; }
        e.stopPropagation();
        var resourceID = editBtn.getAttribute('data-resource-id');
        var resourceData = FrameTrail.module('Database').resources[resourceID];
        openEditDialog(resourceID, resourceData);
    });




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
                classes:  'viewResourcesDialog',
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
     * I build and open a dialog for editing the metadata of a resource (name, license type,
     * license attribution) and for deleting it.
     * @method openEditDialog
     * @param {String} resourceID
     * @param {Object} resourceData
     */
    function openEditDialog(resourceID, resourceData) {

        var licenseOptions = [
            { value: '',            label: '\u2014 ' + labels['ResourceEditLicenseUnspecified'] + ' \u2014' },
            { value: 'Copyright',   label: 'Copyright' },
            { value: 'CC-BY',       label: 'CC BY' },
            { value: 'CC-BY-SA',    label: 'CC BY-SA' },
            { value: 'CC-BY-ND',    label: 'CC BY-ND' },
            { value: 'CC-BY-NC',    label: 'CC BY-NC' },
            { value: 'CC-BY-NC-SA', label: 'CC BY-NC-SA' },
            { value: 'CC-BY-NC-ND', label: 'CC BY-NC-ND' },
            { value: 'CC0',         label: 'CC0 / Public Domain' }
        ];

        var licenseSelectOptions = licenseOptions.map(function(opt) {
            var selected = (opt.value === (resourceData.licenseType || '')) ? ' selected' : '';
            return '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>';
        }).join('');

        var thumbSrc = resourceData.thumb || resourceData.src || '';
        var thumbUrl = thumbSrc ? FrameTrail.module('RouteNavigation').getResourceURL(thumbSrc) : '';
        var thumbStyle = thumbUrl ? 'background-image:url(' + thumbUrl + ');' : '';

        var content = document.createElement('div');
        content.className = 'resourceEditDialogContent';
        content.innerHTML = ''
            + '<div class="layoutRow">'
            +     '<div class="column-5">'
            +         '<div class="resourceThumb" data-type="' + resourceData.type + '" style="' + thumbStyle + 'height:140px;margin-top:5px;cursor:default;position:relative;">'
            +         '</div>'
            +     '</div>'
            +     '<div class="column-7">'
            +         '<div class="layoutRow">'
            +             '<div class="column-12">'
            +                 '<label>' + labels['GenericName'] + '</label>'
            +                 '<input type="text" class="resourceEditName" value="">'
            +             '</div>'
            +         '</div>'
            +         '<div class="layoutRow">'
            +             '<div class="column-12">'
            +                 '<label>' + labels['ResourceEditLicenseType'] + '</label>'
            +                 '<div class="custom-select"><select class="resourceEditLicenseType">' + licenseSelectOptions + '</select></div>'
            +             '</div>'
            +         '</div>'
            +         '<div class="layoutRow">'
            +             '<div class="column-12">'
            +                 '<label>' + labels['ResourceEditLicenseAttribution'] + '</label>'
            +                 '<input type="text" class="resourceEditLicenseAttribution" value="">'
            +             '</div>'
            +         '</div>'
            +         '<p class="message active mb-0" style="margin-top: 10px;">' + labels['ResourceEditNameNote'] + '</p>'
            +     '</div>'
            + '</div>';

        // Set value of name input after creation (avoids HTML encoding issues)
        content.querySelector('.resourceEditName').value = resourceData.name || '';
        content.querySelector('.resourceEditLicenseAttribution').value = resourceData.licenseAttribution || '';

        var editDialog;
        editDialog = Dialog({
            title:   labels['ResourceEditDialogTitle'],
            content: content,
            modal:   true,
            width:   600,
            close:   function() { editDialog.destroy(); }
        });

        var buttonPane = editDialog.widget().querySelector('.ft-dialog-buttonpane');

        var msgEl = document.createElement('div');
        msgEl.className = 'message';
        msgEl.style.flexBasis = '100%';
        buttonPane.appendChild(msgEl);

        var saveBtn = document.createElement('button');
        saveBtn.textContent = labels['GenericSave'];
        buttonPane.appendChild(saveBtn);

        var deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="icon-trash"></span> ' + labels['GenericDelete'];
        deleteBtn.style.marginLeft = 'auto';
        buttonPane.appendChild(deleteBtn);

        function showMessage(text, isError) {
            msgEl.textContent = text;
            msgEl.classList.toggle('error', !!isError);
            msgEl.classList.add('active');
        }

        function clearMessage() {
            msgEl.textContent = '';
            msgEl.classList.remove('active', 'error');
        }

        saveBtn.addEventListener('click', function() {
            var name = content.querySelector('.resourceEditName').value.trim();
            if (!name) {
                showMessage(labels['ResourceEditNameRequired'], true);
                return;
            }
            var updateData = {
                name:                name,
                licenseType:         content.querySelector('.resourceEditLicenseType').value,
                licenseAttribution:  content.querySelector('.resourceEditLicenseAttribution').value.trim()
            };
            saveBtn.disabled = true;
            clearMessage();
            FrameTrail.module('ResourceManager').updateResource(
                resourceID,
                updateData,
                function() {
                    editDialog.destroy();
                    updateList();
                    showStatusMessage(labels['ResourceEditSaveSuccess']);
                },
                function(data) {
                    saveBtn.disabled = false;
                    showMessage(data.string || labels['GenericError'], true);
                }
            );
        });

        deleteBtn.addEventListener('click', function() {
            deleteBtn.disabled = true;
            clearMessage();
            FrameTrail.module('ResourceManager').deleteResource(
                resourceID,
                function() {
                    editDialog.destroy();
                    updateList();
                },
                function(data) {
                    deleteBtn.disabled = false;
                    if (data.code === 5) {
                        showMessage(labels['ResourceEditDeleteInUse'], true);
                    } else {
                        showMessage(data.string || labels['GenericError'], true);
                    }
                }
            );
        });

    }


    /**
     * I update the disabled state of the upload button based on whether saving is allowed.
     * @method updateButtonStates
     */
    function updateButtonStates() {
        var canSave = FrameTrail.module('StorageManager').canSave();
        ResourceUpload.disabled = !canSave;
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
    function changeViewSize() {



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
