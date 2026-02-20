/**
 * @module Shared
 */

/**
 * Base class for storage adapters.
 * Provides the interface that all storage backends must implement.
 *
 * @class StorageAdapter
 */

class StorageAdapter {

    constructor() {
        this._userInfo = null;
    }

    /** @return {String} Adapter type identifier */
    get type() { return 'base'; }

    /** @return {String} Human-readable name for UI */
    get displayName() { return 'Base Storage'; }

    /** @return {Boolean} Whether this adapter can persist writes */
    get canSave() { return false; }

    /** @return {Object|null} User info for this storage context */
    get userInfo() { return this._userInfo; }

    /**
     * Read a JSON file from storage.
     * @param {String} path - Relative path (e.g. 'config.json', 'hypervideos/1/hypervideo.json')
     * @return {Promise<Object>} Parsed JSON data
     */
    async readJSON(path) { throw new Error('Not implemented'); }

    /**
     * Check if a file exists in storage.
     * @param {String} path - Relative path
     * @return {Promise<Boolean>}
     */
    async exists(path) { throw new Error('Not implemented'); }

    /**
     * Write JSON data to storage.
     * @param {String} path - Relative path
     * @param {Object} data - Data to write
     * @return {Promise<void>}
     */
    async writeJSON(path, data) { throw new Error('Not implemented'); }

    /**
     * Create a directory in storage.
     * @param {String} path - Directory path
     * @return {Promise<void>}
     */
    async createDirectory(path) { throw new Error('Not implemented'); }

    /**
     * Initialize the adapter. Must be called before use.
     * @return {Promise<Boolean>}
     */
    async init() { throw new Error('Not implemented'); }

}
