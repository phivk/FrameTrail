# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FrameTrail is an open hypervideo environment for creating, annotating, and remixing interactive videos. It's a client-side JavaScript application with a PHP backend that uses **JSON files instead of a database** for all data storage, making the entire system portable and copyable between servers.

## Architecture

### Application Structure

Three main HTML entry points:
- **[index.html](index.html)** - Main player/editor application (bootstraps with `PlayerLauncher` module)
- **[resources.html](resources.html)** - Standalone resource manager (bootstraps with `ResourceManagerLauncher` module)
- **[setup.html](setup.html)** - Initial configuration wizard (one-time setup)

### Core Framework

**Custom Module System** ([_shared/frametrail-core/frametrail-core.js](_shared/frametrail-core/frametrail-core.js)):
- `FrameTrail.defineModule()` - registers modules with init() and onChange() lifecycle methods
- `FrameTrail.defineType()` - registers data types (Annotation, Overlay, Resource types, etc.)
- `FrameTrail.changeState()` / `FrameTrail.getState()` - global state management with change listeners
- Multiple FrameTrail instances can coexist on one page
- No build system - all modules loaded directly via `<script>` tags

### Key Directories

**Frontend:**
- `_shared/frametrail-core/` - Core framework and module loader
- `_shared/modules/` - Shared modules (Database, UserManagement, ResourceManager, RouteNavigation, Localization, etc.)
- `_shared/types/` - Resource type definitions (ResourceImage, ResourceVideo, ResourceVimeo, ResourceYoutube, ResourcePDF, ResourceLocation, ResourceWikipedia, etc.)
- `player/modules/` - Player-specific modules (HypervideoModel, HypervideoController, AnnotationsController, OverlaysController, Interface, Titlebar, Sidebar, etc.)
- `player/types/` - Player type definitions (Annotation, Overlay, Hypervideo, Subtitle, CodeSnippet)
- `_shared/styles/` - Global CSS
- `_lib/` - Third-party libraries (jQuery, CodeMirror, OpenLayers, D3, HLS.js, etc.)

**Backend:**
- `_server/ajaxServer.php` - Central AJAX endpoint (switch statement dispatcher for all server operations)
- `_server/user.php` - User management logic
- `_server/files.php` - File upload/download handling
- `_server/hypervideos.php` - Hypervideo CRUD operations
- `_server/annotationfiles.php` - Annotation persistence
- `_server/config.php` - Server configuration
- `_server/functions.incl.php` - Shared utility functions

**Data Storage** (`_data/` directory - not in git):
```
_data/
├── config.json              # Global app configuration
├── users.json               # User accounts
├── tagdefinitions.json      # Tag definitions
├── custom.css               # Global custom styles
├── hypervideos/
│   ├── _index.json          # Hypervideo registry
│   └── {hypervideoId}/
│       ├── hypervideo.json  # Metadata, clips, overlays, config
│       ├── annotations/
│       │   ├── _index.json
│       │   └── {userId}.json # User annotations (W3C Web Annotation format)
│       └── subtitles/       # VTT subtitle files
└── resources/
    ├── _index.json          # Resource registry
    └── {files}              # Uploaded media files
```

### Application Modes

**Three primary modes controlled by state:**
1. **Player Mode** (`viewMode: 'video'`) - Video playback with annotations/overlays (read-only)
2. **Editor Mode** (`editMode: true`) - Authenticated editing of annotations and overlays
3. **Overview Mode** (`viewMode: 'overview'`) - Gallery view of all hypervideos

**State variables:**
- `editMode` (true/false) - Whether user is editing
- `viewMode` ('video'/'overview') - Current view type
- `slidePosition` ('middle'/'bottom'/'top') - Layout positioning
- `sidebarOpen` (true/false) - Sidebar visibility
- `fullscreen` (true/false) - Fullscreen mode
- `viewSize` ([width, height]) - Responsive layout dimensions

### Key Architectural Patterns

1. **Module Pattern**: Modules return public interfaces, private state hidden in closures
2. **Observer Pattern**: State changes trigger module `onChange(stateName, stateValue)` callbacks
3. **Lazy Loading**: Modules initialized on-demand via `FrameTrail.initModule()`
4. **File-Based Persistence**: All data stored as JSON files (no database)
5. **Event-Driven**: Timeline events, user actions broadcast to listeners
6. **W3C Web Annotations**: Uses standardized annotation format with FrameTrail extensions

**Important: FrameTrail instance vs global:**
- The global `FrameTrail` object is the factory/registry. `FrameTrail.module()`, `FrameTrail.changeState()`, etc. are only available on **initialized instances** (the `FrameTrail` parameter passed into `defineModule` callbacks).
- Modules defined via `FrameTrail.defineModule()` receive the instance as their closure argument — they can freely call `FrameTrail.module('X')`.
- Plain classes (e.g. `StorageAdapter` subclasses in `_shared/frametrail-core/storage/`) are **not** FrameTrail modules and do **not** have access to any instance. If they need to call module APIs, the caller must pass the FrameTrail instance explicitly.
- Every module must be initialized with `FrameTrail.initModule('ModuleName')` before it can be accessed via `FrameTrail.module('ModuleName')`. Calling `module()` on an uninitialized module returns undefined.

**Storage Modes** (`storageMode` state):
- `'server'` — PHP backend available, data loaded via AJAX to `_server/ajaxServer.php`
- `'local'` — File System Access API, data read/written via `StorageAdapterLocal`
- `'needsFolder'` — File System Access API is supported but no folder has been selected yet; the launcher must prompt the user to pick a `_data` directory before loading data
- `'noStorage'` — No storage backend available (Firefox/Safari on `file://`); app cannot load or save data

### Data Flow

**Client → Server:** All requests go through `_server/ajaxServer.php` with `action` parameter (e.g., `userLogin`, `fileUpload`, `hypervideoAdd`, `annotationfileSave`)

**Server → Client:** JSON responses with success/error status

**Client State Management:**
1. `Database` module loads JSON files via AJAX on app init
2. State changes via `FrameTrail.changeState()` trigger module updates
3. Modules respond to state changes in their `onChange()` method
4. User edits saved back via AJAX to update JSON files

## Development

### Prerequisites

- Apache 2.2.29+ with PHP 5.6.2+
- For local development: Firefox recommended (Chrome has CORS issues with file:// URLs)
- No build tools required - edit files directly

### Running Locally

**Production (with server):**
1. Clone/download to web server directory
2. Access via browser (e.g., `http://localhost/frametrail`)
3. First run opens setup wizard at [setup.html](setup.html)
4. Creates `_data/` directory and admin account

**Read-only (without server):**
1. Open [index.html](index.html) directly in Firefox
2. Editing features disabled without server

### Making Changes

**Adding/Modifying Modules:**
1. Modules located in `_shared/modules/` or `player/modules/`
2. Follow template in `_shared/frametrail-core/_templateModule.js`
3. Register with `FrameTrail.defineModule('ModuleName', function() { ... })`
4. Add `<script>` tag to relevant HTML file (index.html, resources.html)
5. Add CSS if needed (one stylesheet per module)

**Adding/Modifying Types:**
1. Types located in `_shared/types/` or `player/types/`
2. Follow template in `_shared/frametrail-core/_templateType.js`
3. Register with `FrameTrail.defineType('TypeName', function() { ... })`
4. Define constructor and prototype
5. Add `<script>` and `<link>` tags to HTML files

**Modifying Server Logic:**
1. Add new action to switch statement in [_server/ajaxServer.php](_server/ajaxServer.php)
2. Implement logic in specialized PHP file (user.php, files.php, etc.)
3. Return JSON response with `success`/`error` keys
4. Client-side: Call via `FrameTrail.module('Database').ajax(action, data, callback)`

### File Conventions

**JavaScript:**
- Module structure: Private vars/functions in closure, return public interface
- Lifecycle: `init()` called once, `onChange(changedState, stateValue)` for state updates
- No ES6 modules - uses global `FrameTrail` namespace
- jQuery used extensively (`$`)

**CSS:**
- One stylesheet per module/type in same directory as JS
- Loaded in `<head>` of HTML file
- Global styles in `_shared/styles/`
- For `<select>` elements, wrap in a `<div class="custom-select">` to get consistent styled dropdowns with a caret icon (defined in `_shared/styles/generic.css`)

**Data Files:**
- All stored in `_data/` directory (not in git)
- JSON format with pretty printing (`JSON_PRETTY_PRINT`)
- Registry files: `_index.json` files list all items in directory
- Direct file I/O in PHP - no database abstraction layer

### Important Notes

**No Build System:**
- Changes to JS/CSS files are immediately reflected (refresh browser)
- No compilation, bundling, or transpilation
- For production: Consider adding minification/bundling later

**Data Portability:**
- Entire `_data/` directory can be copied between servers
- All user accounts, hypervideos, annotations, resources preserved
- No database dump/restore needed

**User Permissions:**
- Defined in `_data/config.json`
- Roles: admin (all permissions), user (view + annotate), guest (view only)
- Authentication via PHP sessions

**Resource Types:**
- Extensible - each type inherits from base Resource type
- Supported: Video (HTML5), Image, Audio, YouTube, Vimeo, PDF, Wikipedia, OpenStreetMap, Webpage, Text, Quiz, Entity
- Each type has custom rendering and interaction logic

**Annotations:**
- Follow W3C Web Annotation Data Model
- Stored per-user in separate JSON files
- Users can view/compare/reuse others' annotations (if permitted)

**Browser Support:**
- Modern Chrome/Firefox (desktop)
- Safari/Edge/Opera not officially tested
- Mobile: Player works, editing disabled

## Server Configuration

**Key Configuration** ([_server/config.php](_server/config.php)):
- `$conf["dir"]["data"]` - Data directory location (default: `../_data`)
- Session lifetime controlled by PHP `session.gc_maxlifetime`

**Runtime Configuration** (`_data/config.json`):
- Authentication settings
- Upload restrictions (file types, sizes)
- Theme/UI settings
- Default user roles and permissions
- Custom labels for UI elements

## Localization

**Language Files:** `_shared/modules/Localization/`
- Default: `en-US.js`
- German: `de.js`
- Add new languages by creating `{locale}.js` files
- **Important:** Locale files are `.js` files (not `.json`), located in `_shared/modules/Localization/locale/`
- Switch language via `FrameTrail.module('Localization').setLanguage(locale)`
