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
     * Generate a standalone HTML file with the hypervideo data embedded inline.
     * Loads FrameTrail CSS/JS from the jsDelivr CDN — no server required to play.
     * @param {String} hypervideoID
     * @param {String} dataPath - Optional base URL for _data/ (resolves uploaded resource files)
     */
    _generateStandaloneHTML(hypervideoID, dataPath) {
        var Database = this._frameTrailInstance.module('Database');
        var hvData   = Database.convertToDatabaseFormat(hypervideoID);
        var config   = Database.config || {};
        var hvName   = (Database.hypervideos[hypervideoID] && Database.hypervideos[hypervideoID].name) || 'hypervideo';
        var filename = hvName.replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.html';

        var cdnBase = 'https://cdn.jsdelivr.net/npm/@frametrail/frametrail/';

        var initOptions = {
            target:   'body',
            config:   config,
            contents: [{ hypervideo: hvData }]
        };
        if (dataPath) {
            initOptions.dataPath = dataPath;
        }

        var safeTitle = hvName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var html = '<!DOCTYPE html>\n'
            + '<html>\n'
            + '<head>\n'
            + '  <meta charset="UTF-8">\n'
            + '  <title>' + safeTitle + '</title>\n'
            + '  <link rel="stylesheet" href="' + cdnBase + 'frametrail.min.css">\n'
            + '</head>\n'
            + '<body>\n'
            + '  <script src="' + cdnBase + 'frametrail.min.js"><\/script>\n'
            + '  <script>\n'
            + '  FrameTrail.init(' + JSON.stringify(initOptions, null, 4) + ', \'PlayerLauncher\');\n'
            + '  <\/script>\n'
            + '</body>\n'
            + '</html>';

        this._triggerDownload(html, filename, 'text/html');
    }

    /**
     * Download current hypervideo as a flat hypervideo.json (matches on-disk server format).
     * For "All Data" exports use _performZipDownload instead.
     * @param {String} hypervideoID
     * @param {Object} options - { currentHv, allHv, resources, config }
     */
    _performDownload(hypervideoID, options) {
        var Database = this._frameTrailInstance.module('Database');

        // Current hypervideo only → flat hypervideo.json matching the server's on-disk format
        if (options.currentHv && !options.allHv && !options.resources && !options.config && hypervideoID) {
            var hvData   = Database.convertToDatabaseFormat(hypervideoID);
            var hvName   = (Database.hypervideos[hypervideoID] && Database.hypervideos[hypervideoID].name) || 'hypervideo';
            var filename = hvName.replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.json';
            this._triggerDownload(JSON.stringify(hvData, null, 2), filename, 'application/json');
            return;
        }

        // Multi-option export (used by legacy showDownloadDialog) → wrapped envelope
        var data = {};
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
        if (options.resources) { data.resources = Database.resources; }
        if (options.config)    { data.config    = Database.config; }

        this._triggerDownload(JSON.stringify(data, null, 2), 'frametrail-export.json', 'application/json');
    }

    /**
     * Download selected All Data options as a ZIP (multiple files) or single JSON file (one file).
     * Requires fflate to be loaded globally when producing a ZIP.
     * @param {String} hypervideoID - Current hypervideo ID (used for context, not included directly)
     * @param {Object} options - { allHv, resources, config }
     */
    _performZipDownload(hypervideoID, options) {
        var Database = this._frameTrailInstance.module('Database');
        var files = {};

        if (options.allHv) {
            var allHvs  = Database.hypervideos;
            var hvIndex = {};
            for (var id in allHvs) {
                if (allHvs.hasOwnProperty(id)) {
                    files['hypervideos/' + id + '/hypervideo.json'] = Database.convertToDatabaseFormat(id);
                    hvIndex[id] = allHvs[id];
                }
            }
            files['hypervideos/_index.json'] = hvIndex;
        }

        if (options.resources) {
            files['resources/_index.json'] = Database.resources;
        }

        if (options.config) {
            files['config.json'] = Database.config;
        }

        var paths = Object.keys(files);
        if (paths.length === 0) { return; }

        if (paths.length === 1) {
            // Single file — download directly as JSON
            var path     = paths[0];
            var filename = path.split('/').pop();
            this._triggerDownload(JSON.stringify(files[path], null, 2), filename, 'application/json');
            return;
        }

        // Multiple files — bundle as ZIP using fflate
        var zipFiles = {};
        for (var p in files) {
            zipFiles[p] = new TextEncoder().encode(JSON.stringify(files[p], null, 2));
        }
        var zipped = fflate.zipSync(zipFiles, { level: 6 });
        var blob   = new Blob([zipped], { type: 'application/zip' });
        var url    = URL.createObjectURL(blob);
        var a      = document.createElement('a');
        a.href     = url;
        a.download = 'frametrail-export.zip';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Create a blob from content and trigger a browser file download.
     * @private
     */
    _triggerDownload(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

}
