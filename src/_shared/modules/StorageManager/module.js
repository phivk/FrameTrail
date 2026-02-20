/**
 * @module Shared
 */

/**
 * I manage storage adapters and provide a unified interface for reading/writing data.
 *
 * I determine the appropriate storage backend (server, local filesystem, or download)
 * based on the environment and user actions. Modules use me to get the current adapter
 * for storage operations.
 *
 * @class StorageManager
 * @static
 */

FrameTrail.defineModule('StorageManager', function(FrameTrail) {

    var _currentAdapter = null,
        _serverAdapter = null,
        _localAdapter = null,
        _downloadAdapter = null,
        _initialized = false;


    /**
     * Initialize storage system. Determines the default adapter based on environment.
     *
     * - If on HTTP(S) and PHP server responds: use server adapter
     * - If on file:// or no PHP: try to restore a local folder handle
     * - If no handle: signal 'needsFolder' (caller must prompt user)
     *
     * @method init
     * @return {Promise<StorageAdapter>}
     */
    function init() {
        if (_initialized) {
            return Promise.resolve(_currentAdapter);
        }

        _serverAdapter = new StorageAdapterServer();
        _localAdapter = new StorageAdapterLocal();
        _downloadAdapter = new StorageAdapterDownload();

        var hasServer = FrameTrail.module('RouteNavigation').environment.server;

        if (hasServer) {
            // On HTTP(S) — try server adapter
            return _serverAdapter.init().then(function() {
                _currentAdapter = _serverAdapter;
                FrameTrail.changeState('storageMode', 'server');
                _initialized = true;
                return _currentAdapter;
            }).catch(function() {
                // PHP not reachable — try local folder
                return _tryLocal();
            });
        } else {
            // On file:// — try to restore local handle
            return _tryLocal();
        }
    }


    /**
     * Try to restore a local folder handle.
     * If File System Access API is supported but no handle exists, signal 'needsFolder'.
     * If API is not supported, signal 'noStorage'.
     * @private
     */
    function _tryLocal() {
        if (StorageAdapterLocal.isSupported()) {
            return _localAdapter.restoreHandle().then(function(restored) {
                if (restored) {
                    _currentAdapter = _localAdapter;
                    FrameTrail.changeState('storageMode', 'local');
                } else {
                    FrameTrail.changeState('storageMode', 'needsFolder');
                }
                _initialized = true;
                return _currentAdapter;
            }).catch(function() {
                FrameTrail.changeState('storageMode', 'needsFolder');
                _initialized = true;
                return _currentAdapter;
            });
        } else {
            // No File System Access API — use Download adapter so inline-data
            // init options work (view + edit + download-to-save), instead of
            // hard-failing.
            _currentAdapter = _downloadAdapter;
            FrameTrail.changeState('storageMode', 'download');
            _initialized = true;
            return Promise.resolve(_currentAdapter);
        }
    }


    /**
     * Get the current read/write adapter.
     * @method getAdapter
     * @return {StorageAdapter}
     */
    function getAdapter() {
        return _currentAdapter;
    }


    /**
     * @method getServerAdapter
     * @return {StorageAdapterServer}
     */
    function getServerAdapter() {
        return _serverAdapter;
    }


    /**
     * @method getLocalAdapter
     * @return {StorageAdapterLocal}
     */
    function getLocalAdapter() {
        return _localAdapter;
    }


    /**
     * @method getDownloadAdapter
     * @return {StorageAdapterDownload}
     */
    function getDownloadAdapter() {
        return _downloadAdapter;
    }


    /**
     * Switch to local filesystem storage.
     * Prompts user to select a folder via the File System Access API.
     *
     * @method switchToLocal
     * @return {Promise<StorageAdapterLocal>}
     */
    function switchToLocal() {
        if (!StorageAdapterLocal.isSupported()) {
            return Promise.reject(new Error('File System Access API not supported'));
        }
        return _localAdapter.init().then(function() {
            return _localAdapter.persistHandle();
        }).then(function() {
            _currentAdapter = _localAdapter;
            FrameTrail.changeState('storageMode', 'local');
            return _localAdapter;
        });
    }


    /**
     * Switch to server storage.
     * Requires PHP server to be available and user to be logged in.
     *
     * @method switchToServer
     * @return {Promise<StorageAdapterServer>}
     */
    function switchToServer() {
        if (!FrameTrail.module('RouteNavigation').environment.server) {
            return Promise.reject(new Error('No server available'));
        }
        _currentAdapter = _serverAdapter;
        FrameTrail.changeState('storageMode', 'server');
        return Promise.resolve(_serverAdapter);
    }


    /**
     * Check if save is possible with the current adapter.
     * @method canSave
     * @return {Boolean}
     */
    function canSave() {
        if (!_currentAdapter) return false;

        if (_currentAdapter.type === 'server') {
            return FrameTrail.getState('loggedIn');
        }
        return _currentAdapter.canSave;
    }


    /**
     * Check if server save is available (server present and user logged in).
     * @method canSaveToServer
     * @return {Boolean}
     */
    function canSaveToServer() {
        return FrameTrail.module('RouteNavigation').environment.server &&
               FrameTrail.getState('loggedIn');
    }


    /**
     * Check if local filesystem save is available (API supported).
     * @method canSaveToLocal
     * @return {Boolean}
     */
    function canSaveToLocal() {
        return StorageAdapterLocal.isSupported();
    }


    /**
     * Get current user info from the active adapter.
     * @method getCurrentUserInfo
     * @return {Object|null}
     */
    function getCurrentUserInfo() {
        if (_currentAdapter) {
            return _currentAdapter.userInfo;
        }
        return null;
    }


    /**
     * Get the name of the currently selected local folder (if any).
     * @method getFolderName
     * @return {String|null}
     */
    function getFolderName() {
        if (_localAdapter) {
            return _localAdapter.folderName;
        }
        return null;
    }


    return {
        init:               init,
        getAdapter:         getAdapter,
        getServerAdapter:   getServerAdapter,
        getLocalAdapter:    getLocalAdapter,
        getDownloadAdapter: getDownloadAdapter,
        switchToLocal:      switchToLocal,
        switchToServer:     switchToServer,
        canSave:            canSave,
        canSaveToServer:    canSaveToServer,
        canSaveToLocal:     canSaveToLocal,
        getCurrentUserInfo: getCurrentUserInfo,
        getFolderName:      getFolderName
    };

});
