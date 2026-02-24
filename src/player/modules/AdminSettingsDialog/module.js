/**
 * @module Player
 */

/**
 * I am the AdminSettingsDialog. I provide a dialog for editing admin/global settings.
 *
 * @class AdminSettingsDialog
 * @static
 */

FrameTrail.defineModule('AdminSettingsDialog', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    /**
     * I open the admin settings dialog.
     * @method open
     */
    function open() {

        var database = FrameTrail.module('Database');

        // Check if user is admin
        if (FrameTrail.module('UserManagement').userRole !== 'admin') {
            console.error('Admin access required');
            return;
        }

        // Track if changes were made
        var configChanged = false;
        var globalCSSChanged = false;
        var initialConfig = JSON.parse(JSON.stringify(database.config));
        var initialCSS = ($('head > style.FrameTrailGlobalCustomCSS').length != 0) ? $('head > style.FrameTrailGlobalCustomCSS').html() : '';

        var adminDialog = $('<div class="adminSettingsDialog" title="'+ labels['GenericAdministration'] +'"></div>');

        var adminTabs = $('<div class="adminSettingsTabs">'
                        + '    <ul>'
                        + '        <li>'
                        + '            <a href="#Configuration">'+ labels['SettingsConfigurationOptions'] +'</a>'
                        + '        </li>'
                        + '        <li>'
                        + '            <a href="#TagDefinitions">'+ labels['SettingsManageTags'] +'</a>'
                        + '        </li>'
                        + '        <li>'
                        + '            <a href="#ChangeGlobalCSS">'+ labels['SettingsGlobalCSS'] +'</a>'
                        + '        </li>'
                        + '        <li>'
                        + '            <a href="#ChangeTheme">'+ labels['SettingsColorTheme'] +'</a>'
                        + '        </li>'
                        + '    </ul>'
                        + '    <div id="Configuration"></div>'
                        + '    <div id="ChangeTheme"></div>'
                        + '    <div id="ChangeGlobalCSS"></div>'
                        + '    <div id="TagDefinitions"></div>'
                        + '</div>');

        adminDialog.append(adminTabs);

        adminTabs.tabs({
            activate: function(event, ui) {
                var cm6Wrapper = ui.newPanel.find('.cm6-wrapper')[0];
                if (cm6Wrapper && cm6Wrapper._cm6view) { cm6Wrapper._cm6view.requestMeasure(); }
            }
        });

        /* Configuration Editing UI */
        var configData = database.config,
            configurationUI = $('<div class="configEditingForm layoutRow">'
                            +   '    <div class="column-3">'
                            +   '        <input type="checkbox" name="userNeedsConfirmation" id="userNeedsConfirmation" value="userNeedsConfirmation" '+((configData.userNeedsConfirmation && configData.userNeedsConfirmation.toString() == "true") ? "checked" : "")+'>'
                            +   '        <label for="userNeedsConfirmation" data-tooltip-bottom-left="'+ labels['MessageUserRequireConfirmation'] +'">'+ labels['SettingsOnlyConfirmedUsers'] +'</label>'
                            +   '        <div style="margin-top: 5px; margin-bottom: 8px;" data-tooltip-left="'+ labels['MessageUserRequireRole'] +'">'+ labels['SettingsDefaultUserRole'] +': <br>'
                            +   '            <input type="radio" name="defaultUserRole" id="user_role_admin" value="admin" '+((configData.defaultUserRole == "admin") ? "checked" : "")+'>'
                            +   '            <label for="user_role_admin">'+ labels['UserRoleAdmin'] +'</label>'
                            +   '            <input type="radio" name="defaultUserRole" id="user_role_user" value="user" '+((configData.defaultUserRole == "user") ? "checked" : "")+'>'
                            +   '            <label for="user_role_user">'+ labels['UserRoleUser'] +'</label><br>'
                            +   '        </div>'
                            +   '        <input type="checkbox" name="allowCollaboration" id="allowCollaboration" value="allowCollaboration" '+((configData.allowCollaboration && configData.allowCollaboration.toString() == "true") ? "checked" : "")+'>'
                            +   '        <label for="allowCollaboration" data-tooltip-left="'+ labels['MessageUserCollaboration'] +'">'+ labels['SettingsAllowCollaboration'] +'</label><br>'
                            +   '    </div>'
                            +   '    <div class="column-3">'
                            +   '        <input type="checkbox" name="defaultHypervideoHidden" id="defaultHypervideoHidden" value="defaultHypervideoHidden" '+((configData.defaultHypervideoHidden && configData.defaultHypervideoHidden.toString() == "true") ? "checked" : "")+'>'
                            +   '        <label for="defaultHypervideoHidden" data-tooltip-bottom-left="'+ labels['MessageNewHypervideoHidden'] +'">'+ labels['SettingsNewHypervideoHidden'] +'</label>'
                            +   '        <input type="checkbox" name="allowUploads" id="allowUploads" value="allowUploads" '+((configData.allowUploads && configData.allowUploads.toString() == "true") ? "checked" : "")+'>'
                            +   '        <label for="allowUploads" data-tooltip-left="'+ labels['MessageAllowFileUploads'] +'">'+ labels['SettingsAllowUploads'] +'</label>'
                            +   '    </div>'
                            +   '    <div class="column-3">'
                            +   '        <input type="checkbox" name="captureUserTraces" id="captureUserTraces" value="captureUserTraces" '+((configData.captureUserTraces && configData.captureUserTraces.toString() == "true") ? "checked" : "")+'>'
                            +   '        <label for="captureUserTraces">'+ labels['SettingsCaptureUserActions'] +'</label>'
                            +   '        <div class="message active">'+ labels['MessageUserTraces'] +' <i>localStorage.getItem( "frametrail-traces" )</i></div>'
                            +   '    </div>'
                            +   '    <div class="column-3">'
                            +   '        <label for="userTracesStartAction" data-tooltip-bottom-right="'+ labels['MessageUserTracesStartAction'] +'">'+ labels['SettingsUserTracesStartAction'] +'</label>'
                            +   '        <input type="text" style="margin-top: 0px; margin-bottom: 2px;" name="userTracesStartAction" id="userTracesStartAction" placeholder="'+ labels['SettingsUserTracesStartAction'] +'" value="'+ (configData.userTracesStartAction || '') +'">'
                            +   '        <label for="userTracesEndAction" data-tooltip-right="'+ labels['MessageUserTracesStartAction'] +'">'+ labels['SettingsUserTracesEndAction'] +'</label>'
                            +   '        <input type="text" style="margin-top: 0px; margin-bottom: 2px;" name="userTracesEndAction" id="userTracesEndAction" placeholder="'+ labels['SettingsUserTracesEndAction'] +'" value="'+ (configData.userTracesEndAction || '') +'">'
                            +   '    </div>'
                            +   '</div>');

        adminTabs.find('#Configuration').append(configurationUI);

        // Track changes but don't apply them until save
        configurationUI.find('input[type="text"]').on('keydown', function(evt) {
            if (!evt.originalEvent.metaKey && evt.originalEvent.key != 'Meta') {
                configChanged = true;
            }
        });

        configurationUI.find('input[type="checkbox"]').on('change', function(evt) {
            configChanged = true;
        });

        configurationUI.find('input[type="radio"]').on('change', function(evt) {
            configChanged = true;
        });

        /* Change Theme UI */
        var ChangeThemeUI = $('<div class="themeContainer">'
                            + '    <div class="message active">'+ labels['SettingsSelectColorTheme'] +'</div>'
                            + '    <div class="themeItem" data-theme="default">'
                            + '        <div class="themeName">'+ labels['GenericDefault'] +'</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="dark">'
                            + '        <div class="themeName">Dark</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="bright">'
                            + '        <div class="themeName">Bright</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="blue">'
                            + '        <div class="themeName">Blue</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="green">'
                            + '        <div class="themeName">Green</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="orange">'
                            + '        <div class="themeName">Orange</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '    <div class="themeItem" data-theme="grey">'
                            + '        <div class="themeName">Grey</div>'
                            + '        <div class="themeColorContainer">'
                            + '            <div class="primary-fg-color"></div>'
                            + '            <div class="secondary-bg-color"></div>'
                            + '            <div class="secondary-fg-color"></div>'
                            + '        </div>'
                            + '    </div>'
                            + '</div>');

        ChangeThemeUI.find('.themeItem').each(function() {
            if (database.config.theme == $(this).attr('data-theme')) {
                $(this).addClass('active');
            }
            if (!database.config.theme && $(this).attr('data-theme') == 'default') {
                $(this).addClass('active');
            }
        });

        adminTabs.find('#ChangeTheme').append(ChangeThemeUI);

        var selectedThemeValue = database.config.theme || 'default';
        ChangeThemeUI.find('.themeItem').click(function() {
            $(this).siblings('.themeItem').removeClass('active');
            $(this).addClass('active');

            selectedThemeValue = $(this).attr('data-theme');
            configChanged = true;
        });

        /* Global CSS Editing UI */
        var cssText = ($('head > style.FrameTrailGlobalCustomCSS').length != 0) ? $('head > style.FrameTrailGlobalCustomCSS').html() : '';

        var globalCSSEditingUI = $('<div class="globalCSSEditingUI" style="height: 400px;">'
                                 + '    <textarea class="globalCSS">'+ cssText +'</textarea>'
                                 + '</div>');

        adminTabs.find('#ChangeGlobalCSS').append(globalCSSEditingUI);

        // Init CodeMirror 6 editor for CSS Variables
        var textarea = adminTabs.find('.globalCSS');
        var CM6 = window.FrameTrailCM6;

        var cm6Wrapper = $('<div class="cm6-wrapper" style="height: 100%;"></div>');
        textarea.after(cm6Wrapper).hide();

        var cssEditorValue = cssText;

        var codeEditor = new CM6.EditorView({
            state: CM6.EditorState.create({
                doc: cssText,
                extensions: [
                    CM6.oneDark,
                    CM6.lineNumbers(),
                    CM6.highlightActiveLine(),
                    CM6.highlightActiveLineGutter(),
                    CM6.drawSelection(),
                    CM6.history(),
                    CM6.keymap.of([].concat(CM6.defaultKeymap, CM6.historyKeymap)),
                    CM6.EditorView.lineWrapping,
                    CM6.StreamLanguage.define(CM6.legacyModes.css),
                    window.FrameTrailCM6Linters.css,
                    CM6.lintGutter(),
                    CM6.EditorView.updateListener.of(function(update) {
                        if (!update.docChanged) { return; }
                        var isSetter = update.transactions.some(function(tr) {
                            return tr.annotation(CM6.Transaction.userEvent) === 'setValue';
                        });
                        cssEditorValue = update.state.doc.toString();
                        if (!isSetter) {
                            globalCSSChanged = true;
                        }
                    })
                ]
            }),
            parent: cm6Wrapper[0]
        });
        cm6Wrapper[0]._cm6view = codeEditor;

        // this is necessary to be able to manipulate the css live
        if ( $('head > style.FrameTrailGlobalCustomCSS').length == 0 ) {
            if (FrameTrail.getState('storageMode') === 'local') {
                var adapter = FrameTrail.module('StorageManager').getAdapter();
                adapter.readText('custom.css').then(function(cssString) {
                    codeEditor.dispatch({ changes: { from: 0, to: codeEditor.state.doc.length, insert: cssString }, annotations: CM6.Transaction.userEvent.of('setValue') });
                    $('head').append('<style class="FrameTrailGlobalCustomCSS" type="text/css">'+ cssString +'</style>');
                    $('head link[href$="custom.css"]').remove();
                }).catch(function() {
                    // No custom.css yet — create empty style tag so edits can be applied
                    $('head').append('<style class="FrameTrailGlobalCustomCSS" type="text/css"></style>');
                    $('head link[href$="custom.css"]').remove();
                });
            } else if ( $('head link[href$="custom.css"]').length != 0 ) {
                $.get($('head link[href$="custom.css"]').attr('href'))
                    .done(function (cssString) {
                        codeEditor.dispatch({ changes: { from: 0, to: codeEditor.state.doc.length, insert: cssString }, annotations: CM6.Transaction.userEvent.of('setValue') });
                        $('head').append('<style class="FrameTrailGlobalCustomCSS" type="text/css">'+ cssString +'</style>');
                        $('head link[href$="custom.css"]').remove();
                    }).fail(function() {
                        console.log(labels['ErrorCouldNotRetrieveCustomCSS']);
                    });
            }
        }

        /* Tag Definitions UI */
        var tagDefinitionsUI = $('<div class="tagDefinitionsContainer">'
            + '    <div class="tagListHeader">'
            + '        <button class="addTagButton"><span class="icon-plus"></span> '+ labels['TagAdd'] +'</button>'
            + '        <input type="text" class="tagFilterInput" placeholder="'+ labels['SettingsFilterByName'] +'">'
            + '    </div>'
            + '    <div class="tagList"></div>'
            + '</div>');

        adminTabs.find('#TagDefinitions').append(tagDefinitionsUI);

        function renderTagList(filterText) {
            var tagList = tagDefinitionsUI.find('.tagList').empty();
            var allTags = FrameTrail.module('TagModel').getAllTags();

            for (var tagId in allTags) {
                if (filterText && tagId.toLowerCase().indexOf(filterText.toLowerCase()) === -1) {
                    continue;
                }

                var tagData = allTags[tagId];
                var tagItem = $('<div class="tagListItem" data-tag-id="'+ tagId +'">'
                    + '    <div class="tagId">'+ tagId +'</div>'
                    + '    <div class="tagLanguages"></div>'
                    + '    <div class="tagActions">'
                    + '        <button class="editTagButton" title="'+ labels['GenericEditStart'] +'"><span class="icon-pencil"></span></button>'
                    + '        <button class="deleteTagButton" title="'+ labels['GenericDelete'] +'"><span class="icon-trash"></span></button>'
                    + '    </div>'
                    + '</div>');

                var langContainer = tagItem.find('.tagLanguages');
                for (var lang in tagData) {
                    langContainer.append(
                        '<div class="tagLang">'
                        + '    <span class="langCode">'+ lang.toUpperCase() +':</span> '
                        + '    <span class="langLabel">'+ tagData[lang].label +'</span>'
                        + '    <span class="langDesc">&mdash; '+ tagData[lang].description +'</span>'
                        + '</div>'
                    );
                }

                tagList.append(tagItem);
            }

            if (tagList.children().length === 0) {
                tagList.append('<div class="message active">'+ labels['TagNoTagsDefined'] +'</div>');
            }
        }

        renderTagList('');

        tagDefinitionsUI.find('.tagFilterInput').on('input', function() {
            renderTagList($(this).val());
        });

        tagDefinitionsUI.find('.addTagButton').click(function() {
            openTagEditDialog(null);
        });

        tagDefinitionsUI.on('click', '.editTagButton', function() {
            var tagId = $(this).closest('.tagListItem').data('tag-id');
            openTagEditDialog(tagId);
        });

        tagDefinitionsUI.on('click', '.deleteTagButton', function() {
            var tagId = $(this).closest('.tagListItem').data('tag-id');
            confirmDeleteTag(tagId);
        });

        function openTagEditDialog(tagId) {
            var isNew = (tagId === null);
            var allTags = FrameTrail.module('TagModel').getAllTags();
            var existingData = isNew ? {} : (allTags[tagId] || {});
            var existingLangs = isNew ? [] : Object.keys(existingData);

            var dialogContent = $('<div class="tagEditDialog">'
                + '    <div class="formRow">'
                + '        <label>'+ labels['TagID'] +'</label>'
                + '        <input type="text" class="tagIdInput" value="'+ (tagId || '') +'" '+ (isNew ? '' : 'readonly') +'>'
                + '        <div class="fieldHint">'+ labels['TagIDHint'] +'</div>'
                + '    </div>'
                + '    <div class="languagesContainer">'
                + '        <label>'+ labels['TagLanguages'] +'</label>'
                + '        <div class="languagesList"></div>'
                + '        <button class="addLanguageButton"><span class="icon-plus"></span> '+ labels['TagAddLanguage'] +'</button>'
                + '    </div>'
                + '</div>');

            var languagesList = dialogContent.find('.languagesList');

            function addLanguageRow(lang, label, description, isExisting) {
                var row = $('<div class="languageRow" data-lang="'+ (lang || '') +'">'
                    + '    <div class="langHeader">'
                    + '        <input type="text" class="langCodeInput" value="'+ (lang || '') +'" placeholder="en" maxlength="2" '+ (isExisting ? 'readonly' : '') +'>'
                    + (isExisting ? '' : '        <button class="removeLangButton"><span class="icon-cancel"></span></button>')
                    + '    </div>'
                    + '    <div class="langFields">'
                    + '        <input type="text" class="langLabelInput" value="'+ (label || '') +'" placeholder="'+ labels['TagLabel'] +'">'
                    + '        <input type="text" class="langDescInput" value="'+ (description || '') +'" placeholder="'+ labels['TagDescription'] +'">'
                    + '    </div>'
                    + '</div>');

                row.find('.removeLangButton').click(function() {
                    row.remove();
                });

                languagesList.append(row);
            }

            for (var lang in existingData) {
                addLanguageRow(lang, existingData[lang].label, existingData[lang].description, true);
            }

            if (isNew) {
                addLanguageRow('', '', '', false);
            }

            dialogContent.find('.addLanguageButton').click(function() {
                addLanguageRow('', '', '', false);
            });

            dialogContent.dialog({
                title: isNew ? labels['TagAddNew'] : labels['TagEdit'] + ': ' + tagId,
                modal: true,
                width: 500,
                buttons: [
                    {
                        text: labels['GenericCancel'],
                        click: function() { $(this).dialog('close'); }
                    },
                    {
                        text: labels['GenericSave'],
                        click: function() {
                            saveTag(dialogContent, isNew, existingLangs, function() {
                                dialogContent.dialog('close');
                                renderTagList(tagDefinitionsUI.find('.tagFilterInput').val());
                            });
                        }
                    }
                ],
                close: function() { $(this).dialog('destroy').remove(); }
            });
        }

        function saveTag(dialogContent, isNew, existingLangs, onSuccess) {
            var tagId = dialogContent.find('.tagIdInput').val().trim();
            var languageRows = dialogContent.find('.languageRow');

            if (tagId.length < 2) {
                FrameTrail.module('InterfaceModal').showErrorMessage(labels['TagErrorIDTooShort']);
                return;
            }

            if (languageRows.length === 0) {
                FrameTrail.module('InterfaceModal').showErrorMessage(labels['TagErrorNoLanguages']);
                return;
            }

            var saveQueue = [];
            languageRows.each(function() {
                var row = $(this);
                var lang = row.find('.langCodeInput').val().trim().toLowerCase();
                var label = row.find('.langLabelInput').val().trim();
                var desc = row.find('.langDescInput').val().trim();

                if (lang.length === 2 && label.length >= 4 && desc.length >= 4) {
                    saveQueue.push({ lang: lang, label: label, description: desc });
                }
            });

            if (saveQueue.length === 0) {
                FrameTrail.module('InterfaceModal').showErrorMessage(labels['TagErrorInvalidLanguages']);
                return;
            }

            var savedCount = 0;

            function saveNext(idx) {
                if (idx >= saveQueue.length) {
                    onSuccess();
                    return;
                }
                var item = saveQueue[idx];
                FrameTrail.module('TagModel').setTag(
                    tagId,
                    item.lang,
                    item.label,
                    item.description,
                    function() {
                        savedCount++;
                        saveNext(idx + 1);
                    },
                    function() {
                        FrameTrail.module('InterfaceModal').showErrorMessage(labels['TagErrorSaveFailed']);
                    }
                );
            }

            saveNext(0);
        }

        function confirmDeleteTag(tagId) {
            FrameTrail.module('TagModel').deleteTag(tagId,
                function(response) {
                    renderTagList(tagDefinitionsUI.find('.tagFilterInput').val());
                    FrameTrail.module('InterfaceModal').showStatusMessage(labels['TagDeleted']);
                    setTimeout(function() {
                        FrameTrail.module('InterfaceModal').hideMessage(500);
                    }, 1500);
                },
                function(response) {
                    if (response && response.code === 5 && response.response) {
                        showTagUsageWarning(tagId, response.response);
                    } else {
                        FrameTrail.module('InterfaceModal').showErrorMessage(labels['TagErrorDeleteFailed']);
                    }
                }
            );
        }

        function showTagUsageWarning(tagId, usageData) {
            var content = $('<div class="tagUsageWarning">'
                + '    <p><strong>'+ labels['TagCannotDelete'].replace('{tagId}', tagId) +'</strong></p>'
                + '    <p>'+ labels['TagInUseCount'].replace('{count}', usageData.count) +'</p>'
                + '    <ul class="usageList"></ul>'
                + '    <p>'+ labels['TagRemoveBeforeDelete'] +'</p>'
                + '</div>');

            var usageList = content.find('.usageList');

            if (usageData.matches) {
                for (var i = 0; i < usageData.matches.length; i++) {
                    var match = usageData.matches[i];
                    usageList.append(
                        '<li>Hypervideo "'+ match.hypervideo +'" &mdash; '
                        + match.where + ' ('+ match.type +') by '+ match.owner
                        + '</li>'
                    );
                }
            }

            content.dialog({
                title: labels['TagCannotDeleteTitle'],
                modal: true,
                width: 450,
                buttons: [
                    { text: labels['GenericOK'], click: function() { $(this).dialog('close'); } }
                ],
                close: function() { $(this).dialog('destroy').remove(); }
            });
        }

        adminDialog.dialog({
            modal: true,
            resizable: false,
            width: 900,
            height: 600,
            close: function() {
                // If closing without applying (X button or ESC), just remove dialog
                // No changes are applied until "Apply" button is clicked
                $(this).remove();
            },
            buttons: [
                { text: labels['GenericApply'] || labels['GenericSaveChanges'] || 'Apply',
                    click: function() {
                        var dialog = $(this);
                        
                        // Apply and save changes if any were made
                        if (configChanged || globalCSSChanged) {
                            FrameTrail.module('InterfaceModal').showStatusMessage(labels['MessageStateSaving'] || 'Saving...');
                            
                            // Apply config changes from form
                            if (configChanged) {
                                // Apply text input changes
                                configurationUI.find('input[type="text"]').each(function() {
                                    var key = $(this).attr('name'),
                                        value = $(this).val();
                                    if (key) {
                                        database.config[key] = value;
                                    }
                                });
                                
                                // Apply checkbox changes
                                configurationUI.find('input[type="checkbox"]').each(function() {
                                    var key = $(this).attr('name'),
                                        value = $(this).is(':checked');
                                    
                                    if (key) {
                                        database.config[key] = value;
                                    }
                                });
                                
                                // Apply radio changes
                                configurationUI.find('input[type="radio"]:checked').each(function() {
                                    var key = $(this).attr('name'),
                                        value = $(this).val();
                                    if (key) {
                                        database.config[key] = value;
                                    }
                                });
                                
                                // Apply global default theme
                                database.config.theme = selectedThemeValue;
                                // Only apply to current view if the hypervideo has no per-hypervideo theme
                                var hvConfig = database.hypervideo && database.hypervideo.config;
                                if (!hvConfig || !hvConfig.theme) {
                                    $(FrameTrail.getState('target')).attr('data-frametrail-theme', selectedThemeValue);
                                }
                            }
                            
                            // Apply CSS changes
                            if (globalCSSChanged) {
                                $('head > style.FrameTrailGlobalCustomCSS').html(cssEditorValue);
                            }
                            
                            var saveCount = 0;
                            var saveTotal = (configChanged ? 1 : 0) + (globalCSSChanged ? 1 : 0);
                            var saveError = null;
                            
                            var saveClosed = false;
                            function checkSaveComplete() {
                                saveCount++;
                                if (saveCount >= saveTotal && !saveClosed) {
                                    saveClosed = true;
                                    FrameTrail.module('InterfaceModal').hideMessage(500);
                                    if (saveError) {
                                        FrameTrail.module('InterfaceModal').showErrorMessage(labels['ErrorSavingSettings'] || 'Error saving settings');
                                        console.error('Error saving admin settings:', saveError);
                                        // Revert changes on error
                                        if (configChanged) {
                                            database.config = JSON.parse(JSON.stringify(initialConfig));
                                            // Only revert theme on current view if hypervideo has no per-hypervideo theme
                                            var hvCfg = database.hypervideo && database.hypervideo.config;
                                            if (!hvCfg || !hvCfg.theme) {
                                                $(FrameTrail.getState('target')).attr('data-frametrail-theme', initialConfig.theme || 'default');
                                            }
                                        }
                                        if (globalCSSChanged) {
                                            $('head > style.FrameTrailGlobalCustomCSS').html(initialCSS);
                                        }
                                    } else {
                                        // Reload config to ensure consistency
                                        FrameTrail.module('Database').loadConfigData(function(){}, function(){});
                                    }
                                    dialog.dialog('close');
                                }
                            }
                            
                            if (configChanged) {
                                FrameTrail.module('Database').saveConfig(function(result) {
                                    if (!result.success) {
                                        saveError = result.error;
                                    }
                                    checkSaveComplete();
                                });
                            } else {
                                checkSaveComplete();
                            }
                            
                            if (globalCSSChanged) {
                                FrameTrail.module('Database').saveGlobalCSS(function(result) {
                                    if (!result.success) {
                                        saveError = result.error;
                                    }
                                    checkSaveComplete();
                                });
                            } else {
                                checkSaveComplete();
                            }
                        } else {
                            dialog.dialog('close');
                        }
                    }
                },
                { text: labels['GenericCancel'],
                    click: function() {
                        $(this).dialog('close');
                    }
                }
            ]
        });
    }

    return {
        open: open
    };

});
