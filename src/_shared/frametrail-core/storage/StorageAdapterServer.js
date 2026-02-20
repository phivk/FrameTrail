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

    get type() { return 'server'; }
    get displayName() { return 'FrameTrail Server'; }
    get canSave() {
        return FrameTrail.getState('loggedIn');
    }

    async init() {
        if (document.location.protocol === 'file:') {
            throw new Error('No server available (file:// protocol)');
        }

        // Verify PHP backend is reachable
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'POST',
                url: '_server/ajaxServer.php',
                data: { a: 'userCheckLogin' },
                dataType: 'json',
                timeout: 5000
            }).done(function() {
                resolve(true);
            }).fail(function() {
                reject(new Error('PHP server not reachable'));
            });
        });
    }

    async readJSON(path) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'GET',
                url: '_data/' + path,
                cache: false,
                dataType: 'json',
                mimeType: 'application/json'
            }).done(resolve).fail(function() {
                reject(new Error('File not found: ' + path));
            });
        });
    }

    async writeJSON(path, data) {
        var action = this._getActionForPath(path, data);
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'POST',
                url: '_server/ajaxServer.php',
                data: action.params
            }).done(function(response) {
                if (response.code === 0) {
                    resolve();
                } else {
                    reject(new Error(response.string || 'Server error code ' + response.code));
                }
            }).fail(reject);
        });
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
