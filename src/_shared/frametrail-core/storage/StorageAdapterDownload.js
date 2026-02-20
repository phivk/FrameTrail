/**
 * @module Shared
 */

/**
 * Storage adapter for JSON download fallback.
 * Used when File System Access API is not supported (Firefox, Safari).
 * Stores data in memory and allows downloading as JSON files.
 *
 * @class StorageAdapterDownload
 * @extends StorageAdapter
 */

class StorageAdapterDownload extends StorageAdapter {

    constructor() {
        super();
        this._data = {};  // In-memory cache

        // Pre-load user identity so isLoggedIn() works before init() is called.
        // If a returning user is stored in localStorage, use it immediately.
        // Otherwise set a default so the edit button is visible; init() will
        // prompt for a real name on the first save attempt.
        var storedUser = null;
        try { storedUser = JSON.parse(localStorage.getItem('frametrail_local_user')); } catch (e) {}
        this._userInfo = (storedUser && storedUser.id)
            ? storedUser
            : { id: 'localuser', name: 'Local User', role: 'admin', mail: '', color: '#FF9800' };
    }

    get type() { return 'download'; }
    get displayName() { return 'Download'; }
    get canSave() { return true; }
    get userInfo() { return this._userInfo; }

    async init() {
        var localUser = localStorage.getItem('frametrail_local_user');
        if (localUser) {
            this._userInfo = JSON.parse(localUser);
        } else {
            var name = prompt('Enter your name for annotations:', 'Local User');
            this._userInfo = {
                id: 'local-' + Date.now(),
                name: name || 'Local User',
                role: 'admin',
                mail: '',
                registrationDate: Date.now(),
                color: '#FF9800'
            };
            localStorage.setItem('frametrail_local_user', JSON.stringify(this._userInfo));
        }
        return true;
    }

    async readJSON(path) {
        if (this._data[path]) {
            return this._data[path];
        }
        throw new Error('File not in memory: ' + path);
    }

    async writeJSON(path, data) {
        this._data[path] = data;
    }

    async exists(path) {
        return path in this._data;
    }

    async createDirectory(path) {
        // No-op for in-memory storage
    }

    /**
     * Show download dialog where user chooses what to include.
     * @param {String} hypervideoID - Current hypervideo ID
     * @param {Object} frameTrailInstance - The FrameTrail instance (needed to access modules)
     */
    showDownloadDialog(hypervideoID, frameTrailInstance) {
        this._frameTrailInstance = frameTrailInstance;
        var labels = frameTrailInstance.module('Localization').labels;
        var dialog = $('<div class="downloadDialog" title="' + labels['DownloadProjectData'] + '">'
            + '<p>' + labels['DownloadWhatToInclude'] + '</p>'
            + '<div class="downloadOptions">'
            + '  <label><input type="checkbox" name="currentHv" checked> ' + labels['DownloadCurrentHypervideo'] + '</label>'
            + '  <small>hypervideo.json + annotations</small>'
            + '  <label><input type="checkbox" name="allHv"> ' + labels['DownloadAllHypervideos'] + '</label>'
            + '  <label><input type="checkbox" name="resources"> ' + labels['DownloadResourcesIndex'] + '</label>'
            + '  <small>resources/_index.json</small>'
            + '  <label><input type="checkbox" name="config"> ' + labels['DownloadConfiguration'] + '</label>'
            + '  <small>config.json</small>'
            + '</div>'
            + '</div>');

        var self = this;
        dialog.dialog({
            modal: true,
            width: 400,
            close: function() { $(this).remove(); },
            buttons: [
                {
                    text: labels['GenericDownload'],
                    click: function() {
                        var options = {
                            currentHv: dialog.find('[name="currentHv"]').is(':checked'),
                            allHv: dialog.find('[name="allHv"]').is(':checked'),
                            resources: dialog.find('[name="resources"]').is(':checked'),
                            config: dialog.find('[name="config"]').is(':checked')
                        };
                        self._performDownload(hypervideoID, options);
                        $(this).dialog('close');
                    }
                },
                {
                    text: labels['GenericCancel'],
                    click: function() {
                        $(this).dialog('close');
                    }
                }
            ]
        });
    }

    /**
     * Generate and trigger file download.
     * @private
     */
    _performDownload(hypervideoID, options) {
        var data = {};
        var Database = this._frameTrailInstance.module('Database');

        if (options.currentHv || options.allHv) {
            data.hypervideos = {};

            if (options.allHv) {
                var allHvs = Database.hypervideos;
                for (var id in allHvs) {
                    if (allHvs.hasOwnProperty(id)) {
                        data.hypervideos[id] = Database.convertToDatabaseFormat(id);
                    }
                }
            } else if (options.currentHv && hypervideoID) {
                data.hypervideos[hypervideoID] = Database.convertToDatabaseFormat(hypervideoID);
            }
        }

        if (options.resources) {
            data.resources = Database.resources;
        }

        if (options.config) {
            data.config = Database.config;
        }

        // Generate filename
        var filename = 'frametrail-export';
        if (options.currentHv && !options.allHv && hypervideoID) {
            var hvs = Database.hypervideos;
            var hvName = (hvs[hypervideoID] && hvs[hypervideoID].name) || 'hypervideo';
            filename = hvName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        }
        filename += '.json';

        // Trigger download
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

}
