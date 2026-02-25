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
        this._userInfo = {};  // Set by UserManagement after guest login
    }

    get type() { return 'download'; }
    get displayName() { return 'Download'; }
    get canSave() { return false; }  // In-memory only — no persistent save target; use Save As / download
    get userInfo() { return this._userInfo; }

    /**
     * Update the stored user info (called from UserManagement after guest login).
     * @param {Object} info - User info object {id, name, role, color}
     */
    setUserInfo(info) {
        this._userInfo = info;
    }

    async init() {
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
        var dialog = document.createElement('div');
        dialog.className = 'downloadDialog';
        dialog.innerHTML = '<p>' + labels['DownloadWhatToInclude'] + '</p>'
            + '<div class="downloadOptions">'
            + '  <label><input type="checkbox" name="currentHv" checked> ' + labels['DownloadCurrentHypervideo'] + '</label>'
            + '  <small>hypervideo.json + annotations</small>'
            + '  <label><input type="checkbox" name="allHv"> ' + labels['DownloadAllHypervideos'] + '</label>'
            + '  <label><input type="checkbox" name="resources"> ' + labels['DownloadResourcesIndex'] + '</label>'
            + '  <small>resources/_index.json</small>'
            + '  <label><input type="checkbox" name="config"> ' + labels['DownloadConfiguration'] + '</label>'
            + '  <small>config.json</small>'
            + '</div>';

        var self = this;
        var dlgCtrl = Dialog({
            title:   labels['DownloadProjectData'],
            content: dialog,
            modal:   true,
            width:   400,
            close: function() { dlgCtrl.destroy(); },
            buttons: [
                {
                    text: labels['GenericDownload'],
                    click: function() {
                        var options = {
                            currentHv: dialog.querySelector('[name="currentHv"]').checked,
                            allHv:     dialog.querySelector('[name="allHv"]').checked,
                            resources: dialog.querySelector('[name="resources"]').checked,
                            config:    dialog.querySelector('[name="config"]').checked
                        };
                        self._performDownload(hypervideoID, options);
                        dlgCtrl.close();
                    }
                },
                {
                    text: labels['GenericCancel'],
                    click: function() {
                        dlgCtrl.close();
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
