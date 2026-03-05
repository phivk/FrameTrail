/**
 * @module Shared
 */

/**
 * Storage adapter for the PHP server backend.
 * Wraps existing AJAX patterns for reading/writing data via ajaxServer.php.
 *
 * For reads, uses direct GET to _data/ paths (matching existing loadData patterns).
 * For writes, routes to appropriate PHP action endpoints.
 *
 * Note: Complex saves like saveAnnotations bypass writeJSON entirely and are
 * handled by the Database module's existing save methods with storageMode branching.
 *
 * @class StorageAdapterServer
 * @extends StorageAdapter
 */

class StorageAdapterServer extends StorageAdapter {

    /**
     * @param {String} serverBase  Base URL for the PHP server dir, e.g. '_server/' or 'https://api.example.com/ft/_server/'
     * @param {String} dataBase    Base URL for the data dir, e.g. '_data/' or 'https://cdn.example.com/project/_data/'
     */
    constructor(serverBase, dataBase) {
        super();
        this._serverBase = serverBase || '_server/';
        this._dataBase   = dataBase   || '_data/';
    }

    get type() { return 'server'; }
    get displayName() { return 'FrameTrail Server'; }
    get canSave() {
        // Note: StorageManager.canSave() special-cases 'server' and does not call this getter.
        // It is kept for completeness but should not be relied on.
        return true;
    }

    async init() {
        if (document.location.protocol === 'file:') {
            throw new Error('No server available (file:// protocol)');
        }

        // Verify PHP backend is reachable
        var resp = await fetch(this._serverBase + 'ajaxServer.php', {
            method: 'POST',
            cache: 'no-cache',
            body: new URLSearchParams({ a: 'userCheckLogin' })
        });
        if (!resp.ok) throw new Error('PHP server not reachable');
        return true;
    }

    async readJSON(path) {
        var resp = await fetch(this._dataBase + path, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('File not found: ' + path);
        return resp.json();
    }

    async writeJSON(path, data) {
        var action = this._getActionForPath(path, data);
        var resp = await fetch(this._serverBase + 'ajaxServer.php', {
            method: 'POST',
            body: new URLSearchParams(action.params)
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var result = await resp.json();
        if (result.code !== 0) {
            throw new Error(result.string || 'Server error code ' + result.code);
        }
    }

    async exists(path) {
        try {
            await this.readJSON(path);
            return true;
        } catch (e) {
            return false;
        }
    }

    async createDirectory(path) {
        // Directories are managed by the PHP server automatically
        return;
    }

    /**
     * Map file paths to PHP action parameters.
     * Used for simple writes. Complex saves (annotations) are handled
     * directly by Database module's existing save methods.
     * @private
     */
    _getActionForPath(path, data) {
        var match;

        if ((match = path.match(/^hypervideos\/([^/]+)\/hypervideo\.json$/))) {
            return {
                params: {
                    a: 'hypervideoChange',
                    hypervideoID: match[1],
                    src: JSON.stringify(data, null, 4)
                }
            };
        }
        if (path === 'config.json') {
            return {
                params: {
                    a: 'configChange',
                    src: JSON.stringify(data, null, 4)
                }
            };
        }
        if (path === 'custom.css') {
            return {
                params: {
                    a: 'globalCSSChange',
                    src: (typeof data === 'string') ? data : ''
                }
            };
        }
        throw new Error('Unknown path for server write: ' + path);
    }

}
