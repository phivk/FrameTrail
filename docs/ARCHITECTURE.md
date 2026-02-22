# FrameTrail Architecture

This document describes the internal architecture of FrameTrail for developers who want to understand, extend, or contribute to the codebase.

## Core Framework

### The FrameTrail Object

The global `FrameTrail` object is defined in `src/_shared/frametrail-core/frametrail-core.js` and provides the foundation for the entire application:

```javascript
window.FrameTrail = {
    defineModule:  // Register a module definition
    defineType:    // Register a type definition
    init:          // Create a new FrameTrail instance
    autoInit:      // Scan for [data-frametrail] video elements and init each
    instances:     // Array of all active instances
};
```

### Instance API

When `FrameTrail.init()` is called, it returns an instance with:

```javascript
{
    start:            // Start the application
    initModule:       // Initialize a module
    unloadModule:     // Unload a module
    module:           // Get a module's public interface
    modules:          // Get all loaded modules
    getState:         // Read global state
    changeState:      // Update global state (triggers listeners)
    type:             // Get a type constructor
    newObject:        // Create instance of a type
    triggerEvent:     // Fire custom events
    addEventListener: // Listen to custom events
}
```

### Instance vs Global

The global `FrameTrail` object is the factory/registry. Instance methods like `module()`, `changeState()`, `getState()` are only available on initialized instances — the `FrameTrail` parameter passed into `defineModule` callbacks.

- Modules defined via `FrameTrail.defineModule()` receive the instance as their closure argument and can freely call `FrameTrail.module('X')`.
- Plain classes (e.g. `StorageAdapter` subclasses in `src/_shared/frametrail-core/storage/`) are **not** FrameTrail modules and do not have access to any instance. If they need to call module APIs, the caller must pass the FrameTrail instance explicitly.
- Every module must be initialized with `FrameTrail.initModule('ModuleName')` before it can be accessed via `FrameTrail.module('ModuleName')`.

## Module System

### Defining Modules

Modules encapsulate related functionality. They're defined with `FrameTrail.defineModule()`:

```javascript
FrameTrail.defineModule('ModuleName', function(FrameTrail) {

    // Private scope — variables and functions here are not accessible outside
    var privateVar = 'hidden';

    function privateFunction() {
        // Can access other modules
        var db = FrameTrail.module('Database');

        // Can read/write global state
        var editMode = FrameTrail.getState('editMode');
        FrameTrail.changeState('editMode', true);
    }

    // Return public interface
    return {
        publicMethod: privateFunction,

        // State change listeners (called automatically)
        onChange: {
            'editMode': function(newVal, oldVal) { /* react */ },
            'viewMode': function(newVal, oldVal) { /* react */ }
        },

        // Called when module is unloaded
        onUnload: function() { /* cleanup */ }
    };
});
```

### Module Lifecycle

1. **Definition**: `FrameTrail.defineModule()` registers the factory function
2. **Initialization**: `FrameTrail.initModule('Name')` calls the factory and stores the public interface
3. **Usage**: `FrameTrail.module('Name').method()` accesses the public interface
4. **State reactions**: `onChange` handlers are called automatically when state changes
5. **Unload**: `FrameTrail.unloadModule('Name')` calls `onUnload` and removes the module

### Module Inventory

#### Shared Modules (`src/_shared/modules/`)

| Module | Purpose |
|--------|---------|
| `Database` | Loads/saves all JSON data via the active storage adapter |
| `StorageManager` | Selects and initializes the appropriate storage adapter; exposes `canSave()` / `canSaveToServer()` |
| `RouteNavigation` | URL parsing, hash parameters, environment detection |
| `UserManagement` | Login, registration, user settings, and guest editing (name-only, no account required) |
| `Localization` | Multi-language string management (en-US, de) |
| `ResourceManager` | Resource CRUD operations |
| `ViewResources` | Resource gallery/grid view |
| `TagModel` | Tag definitions and filtering |
| `HypervideoPicker` | Hypervideo selection dialog |
| `HypervideoFormBuilder` | Hypervideo creation/edit forms |
| `UserTraces` | User activity tracking |
| `UndoManager` | Undo/redo for editing operations |

#### Player Modules (`src/player/modules/`)

| Module | Purpose |
|--------|---------|
| `PlayerLauncher` | Bootstrap and initialization orchestration |
| `HypervideoModel` | Current hypervideo data model |
| `HypervideoController` | Playback control, timing |
| `AnnotationsController` | Annotation lifecycle management |
| `OverlaysController` | Overlay lifecycle management |
| `SubtitlesController` | Subtitle loading and display |
| `CodeSnippetsController` | Code snippet execution at timestamps |
| `InteractionController` | Drag/drop, resize for editing |
| `TimelineController` | Timeline UI and scrubbing |
| `Interface` | Main UI coordinator |
| `InterfaceModal` | Dialogs, loading screens |
| `Sidebar` | Sidebar panel management |
| `Titlebar` | Top bar with controls |
| `ViewVideo` | Video player view |
| `ViewOverview` | Hypervideo selection grid |
| `ViewLayout` | Content view layout areas |
| `HypervideoSettingsDialog` | Hypervideo configuration |
| `AdminSettingsDialog` | Admin settings panel |

#### Resource Manager Module (`src/resourcemanager/modules/`)

| Module | Purpose |
|--------|---------|
| `ResourceManagerLauncher` | Bootstrap for standalone resource manager |

### Module Initialization Order

The `PlayerLauncher` module orchestrates initialization:

```
1. Localization
2. InterfaceModal (shows loading screen)
3. RouteNavigation
4. StorageManager (detects storage mode)
5. UserManagement
6. Database (loads data via storage adapter)
7. TagModel
8. ResourceManager
9. HypervideoFormBuilder
10. HypervideoModel
11. Interface (initializes sub-modules)
12. HypervideoController (if viewing a hypervideo)
13. UserTraces
14. UndoManager
```

## Type System

### Defining Types

Types define data structures with inheritance support:

```javascript
FrameTrail.defineType('TypeName', function(FrameTrail) {
    return {
        parent: 'ParentType',  // Optional inheritance

        constructor: function(data) {
            this.data = data;
        },

        prototype: {
            render: function() { /* ... */ },
            get name() { return this.data.name; }
        }
    };
});
```

### Creating Instances

```javascript
var overlay = FrameTrail.newObject('Overlay', overlayData);
overlay.render();
```

### Type Hierarchy

```
Resource (abstract base)
├── ResourceVideo
├── ResourceImage
├── ResourceAudio
├── ResourceYoutube
├── ResourceVimeo
├── ResourceWistia
├── ResourceLoom
├── ResourceTwitch
├── ResourceSoundcloud
├── ResourceSpotify
├── ResourceWebpage
├── ResourceWikipedia
├── ResourcePDF
├── ResourceText
├── ResourceLocation
├── ResourceQuiz
├── ResourceHotspot
├── ResourceEntity
├── ResourceXTwitter
├── ResourceBluesky
├── ResourceMastodon
├── ResourceTiktok
├── ResourceReddit
├── ResourceFlickr
├── ResourceCodepen
├── ResourceFigma
├── ResourceSlideshare
├── ResourceUrlPreview
└── ResourceFlickr

Overlay          (video overlay with position + time range)
Annotation       (sidebar annotation with time range)
Hypervideo       (hypervideo data wrapper)
Subtitle         (VTT subtitle cue)
CodeSnippet      (timed JavaScript execution)
ContentView      (layout area content)
```

Each Resource type implements:
- `renderContent()` — Display the resource in the player
- `renderThumb()` — Thumbnail for the resource manager
- `renderPropertiesControls()` — Editing UI for overlays
- `renderTimeControls()` — Editing UI for annotations

## State Management

### Global State

State is managed centrally and changes trigger reactive updates:

```javascript
// Read state
var editMode = FrameTrail.getState('editMode');
var allState = FrameTrail.getState(); // Returns full state object

// Update state (triggers onChange handlers in all modules)
FrameTrail.changeState('editMode', true);
```

### Core State Properties

| Property | Type | Description |
|----------|------|-------------|
| `target` | String/Element | CSS selector or DOM element for mount point |
| `editMode` | Boolean/String | `false`, `'overlays'`, `'annotations'`, etc. |
| `viewMode` | String | `'video'`, `'overview'`, `'resources'` |
| `storageMode` | String | `'server'`, `'local'`, `'needsFolder'`, `'download'` |
| `loggedIn` | Boolean | User authentication status |
| `username` | String | Current user's name |
| `fullscreen` | Boolean | Fullscreen state |
| `sidebarOpen` | Boolean | Sidebar visibility |
| `viewSize` | Array | `[width, height]` of viewport |
| `unsavedChanges` | Boolean | Dirty flag for editing |
| `slidePosition` | String | `'left'`, `'middle'`, `'right'` |
| `videoElement` | String/Element | Selector or ref to an existing `<video>` to adopt (shorthand API) |
| `videoSource` | String | Video URL to use when creating a new `<video>` (shorthand API) |
| `annotations` | String/Array | URL string or array of W3C annotation URLs / inline objects (shorthand API) |
| `serverPath` | String | Prefix prepended to all internal `_server/` and `_data/` AJAX URLs |

### Reactive Updates

When state changes, all modules with matching `onChange` handlers are notified:

```javascript
// In Module A
FrameTrail.changeState('editMode', 'overlays');

// In Module B (automatic callback)
onChange: {
    'editMode': function(newValue, oldValue) {
        // newValue = 'overlays', oldValue = false
        this.updateUI();
    }
}
```

## Storage Architecture

### Storage Adapters

FrameTrail uses a strategy pattern for data persistence. The `StorageManager` module detects the environment and initializes the appropriate adapter:

| Adapter | Class | When Used |
|---------|-------|-----------|
| Server | `StorageAdapterServer` | HTTP/HTTPS with PHP backend responding at `_server/ajaxServer.php` |
| Local | `StorageAdapterLocal` | File System Access API available (Chrome/Edge) and folder selected |
| Download | `StorageAdapterDownload` | Primary adapter when no server and no File System Access API (Firefox/Safari, or `file://` protocol). Stores data in memory; `canSave` is `false` (no persistent target); exports via Save As. Also available as a supplemental export tool in server and local modes. |

All adapters implement the same interface, so the rest of the application doesn't need to know which storage backend is active.

### Storage Mode Detection

`StorageManager.init()` determines the storage mode at startup:

1. If on HTTP/HTTPS **and** PHP backend responds at `_server/ajaxServer.php` → `'server'`
2. If on HTTP/HTTPS **but** PHP is unreachable, or on `file://` protocol:
   - If File System Access API is supported (Chrome/Edge) → try to restore a previously saved folder handle
     - Handle restored → `'local'`
     - No handle saved → `'needsFolder'` (folder picker dialog is shown)
   - File System Access API not supported (Firefox/Safari) → `'download'`

In `'download'` mode the `StorageAdapterDownload` is used: data is stored in memory, and users can export their work as JSON via the Save As dialog. Viewing and editing both work. Once a folder is selected in `'needsFolder'` mode, the state transitions to `'local'`.

## Data Model

### File-Based Storage

All data is stored as JSON files in `_data/`:

```
_data/
├── config.json           # Instance configuration
├── users.json            # User accounts
├── tagdefinitions.json   # Tag definitions
├── custom.css            # Custom global CSS
├── resources/
│   ├── _index.json       # Resource metadata
│   └── [files...]        # Uploaded media
└── hypervideos/
    ├── _index.json       # Hypervideo list
    └── [id]/
        ├── hypervideo.json    # Hypervideo data + content
        ├── annotations/
        │   ├── _index.json    # Annotation file index
        │   └── [userId].json  # Per-user annotations
        └── subtitles/         # VTT subtitle files
```

### Hypervideo Structure

```json
{
  "meta": {
    "name": "Video Title",
    "description": "Description",
    "thumb": "thumbnail.jpg",
    "creator": "username",
    "creatorId": "user-id",
    "created": 1234567890,
    "lastchanged": 1234567890
  },
  "config": {
    "layoutArea": { "areaTop": [], "areaBottom": [], "areaLeft": [], "areaRight": [] },
    "hidden": false,
    "slidingMode": "overlay"
  },
  "clips": [
    { "resourceId": "resource-id", "duration": 120, "start": 0, "end": 120 }
  ],
  "contents": [ /* overlays and code snippets (W3C Web Annotation format) */ ],
  "subtitles": { "en": "subtitles/en.vtt" },
  "globalEvents": { "onReady": "", "onPlay": "", "onPause": "", "onEnded": "" },
  "customCSS": ""
}
```

Overlays and annotations use the **W3C Web Annotation** data model with `frametrail:` extensions for position, type, and attributes.

### Resource Structure

```json
{
  "resource-id": {
    "name": "My Image",
    "type": "image",
    "src": "image.jpg",
    "thumb": "image_thumb.jpg",
    "licenseType": "cc-by-sa",
    "attributes": {},
    "tags": ["nature", "landscape"]
  }
}
```

## Event System

### Custom Events

Modules can communicate via custom events:

```javascript
// Fire event
FrameTrail.triggerEvent('myCustomEvent', { data: 'value' });

// Listen to event
FrameTrail.addEventListener('myCustomEvent', function(event) {
    console.log(event.detail.data);
});
```

### DOM Events

UI components use standard jQuery event handling.

## Environment Detection

The `RouteNavigation` module provides environment info:

```javascript
var env = FrameTrail.module('RouteNavigation').environment;

env.server    // Boolean: true if running on HTTP server
env.hostname  // String: current hostname
env.iframe    // Boolean: true if embedded in iframe
```

## URL Routing

### Hash-Based Navigation

FrameTrail uses hash fragments for navigation:

```
index.html#hypervideo=abc123&t=30.5
```

| Parameter | Description |
|-----------|-------------|
| `hypervideo` | Hypervideo ID to load |
| `t` | Start time in seconds |

## CSS Architecture

### CSS Custom Properties (Theming)

Themes are defined in `src/_shared/styles/variables.css`:

```css
.frametrail-body {
    --primary-bg-color: rgba(47, 50, 58, 1);
    --primary-fg-color: rgba(255, 255, 255, 1);
    --secondary-bg-color: rgba(73, 76, 81, .6);
    --highlight-color: #D8D3AD;
}
```

Themes are applied via `data-frametrail-theme` attribute:

```css
.frametrail-body[data-frametrail-theme="bright"] {
    --primary-bg-color: rgba(255, 255, 255, 1);
    --primary-fg-color: rgba(80, 80, 80, 1);
}
```

### CSS Organization

- `src/_shared/styles/variables.css` — Theme definitions (CSS custom properties)
- `src/_shared/styles/generic.css` — Common styles, custom select dropdowns
- `src/_shared/styles/frametrail-webfont.css` — FrameTrail icon font
- `src/player/types/[Type]/style.css` — Player type styles
- `src/_shared/types/[Type]/style.css` — Resource type styles
- `src/player/modules/[Module]/style.css` — Player module styles
- `src/_shared/modules/[Module]/style.css` — Shared module styles

## Backend (PHP)

### API Endpoints

All AJAX requests go through `src/_server/ajaxServer.php`:

| Action | Description |
|--------|-------------|
| `setupCheck` | Check if initial setup has been completed |
| `setupInit` | Run first-time setup |
| `userRegister` | Create new user |
| `userLogin` | Authenticate user |
| `userLogout` | End session |
| `userChange` | Update user settings |
| `hypervideoAdd` | Create hypervideo |
| `hypervideoChange` | Update hypervideo |
| `hypervideoClone` | Duplicate hypervideo |
| `hypervideoDelete` | Remove hypervideo |
| `resourcesAdd` | Upload resource |
| `resourcesDelete` | Remove resource |
| `configChange` | Update config |
| `annotationfileSave` | Save user annotations |

### Sessions

PHP sessions are used for authentication. Session data is stored in `$_SESSION['ohv']`.

## Initialization Options

### Full Init (server or inline data)

The complete init signature — used when loading data from a PHP server or passing it fully inline:

```javascript
FrameTrail.init({
    // ── Mount point ───────────────────────────────────────────────────────────
    target:         '#container',   // CSS selector or DOM element (default: 'body')

    // ── Data sources ──────────────────────────────────────────────────────────
    startID:        'hypervideo-id',// ID of the hypervideo to open (skips overview)
    config:         { /* … */ },   // Inline config object — skips _data/config.json.
                                    // Pass null to load from the server instead.
    contents:       null,           // Pre-loaded hypervideo data (see inline-data pattern)
    resources:      [{ /* … */ }], // Resource pool definitions (see below)
    tagdefinitions: null,           // Tag definitions (loaded from server if null)
    language:       'en-US',        // UI language code

    // ── Server path ───────────────────────────────────────────────────────────
    serverPath:     '',             // Prefix for all internal _server/ and _data/
                                    // AJAX URLs. Use when FrameTrail is loaded from
                                    // a subdirectory or a remote origin.
                                    // Examples:
                                    //   serverPath: '../'              (one level up)
                                    //   serverPath: 'https://api.example.com/'

    // ── Advanced ──────────────────────────────────────────────────────────────
    contentTargets: {}              // Custom DOM targets for content views
}, 'PlayerLauncher');
```

### Shorthand Init (lightweight embedding)

Three patterns for embedding a single video without any `_data/` folder or server:

#### Scenario A — Adopt an existing `<video>` element

FrameTrail auto-creates a wrapper div immediately before the video element and uses that as the player container. The video's computed `width` and `height` are copied to the wrapper so the layout is a seamless replacement.

```javascript
// HTML: <video id="my-video" src="video.mp4" playsinline=""></video>

FrameTrail.init({
    videoElement: '#my-video',          // CSS selector or DOM element ref — no target needed
    annotations:  'annotations.json',  // URL string, array of URLs, or inline W3C objects
    language:     'en-US',
    config:       { autohideControls: true }
}, 'PlayerLauncher');
```

#### Scenario B — Explicit container + video URL

FrameTrail creates a `<video>` element inside the given container and sources it from the URL.

```javascript
// HTML: <div id="player"></div>

FrameTrail.init({
    target:      '#player',
    videoSource: 'https://example.com/video.mp4',
    annotations: [
        'https://example.com/annotations.json',    // URL string
        { /* inline W3C Annotation object */ }      // or inline object
    ],
    language: 'en-US'
}, 'PlayerLauncher');
```

#### Scenario C — Data-attribute auto-scan

Decorate `<video>` tags with `data-frametrail` and call `FrameTrail.autoInit()` once.

```html
<video data-frametrail
       data-frametrail-annotations="annotations.json"
       data-frametrail-language="en-US"
       data-frametrail-config='{"autohideControls": true}'
       src="video.mp4"
       playsinline="">
</video>

<script>
$(document).ready(function() {
    // Initialises all [data-frametrail] video elements on the page.
    // Pass a DOM element or selector to limit the scan to a subtree:
    //   FrameTrail.autoInit(document.getElementById('article'));
    FrameTrail.autoInit();
});
</script>
```

Supported data attributes:

| Attribute | Maps to | Example |
|-----------|---------|---------|
| `data-frametrail` | presence flag — triggers auto-init | |
| `data-frametrail-annotations` | `annotations` | `"path/to/file.json"` |
| `data-frametrail-language` | `language` | `"de"` |
| `data-frametrail-config` | `config` (inline JSON) | `'{"autohideControls":true}'` |

In all three shorthand scenarios:
- `storageMode` is forced to `'download'` (in-memory, no persistence needed)
- `startID` is set to `'0'` automatically — the overview is skipped
- Overview mode is never shown (Titlebar hides the toggle when only one video is present)

### `serverPath` option

When FrameTrail is loaded from a subdirectory (e.g. `examples/`) or a different origin from the PHP backend, pass `serverPath` so that internal AJAX calls resolve correctly:

```javascript
// FrameTrail installed at site root; page served from /examples/
FrameTrail.init({
    serverPath: '../',
    // … other options …
}, 'PlayerLauncher');

// FrameTrail backend on a separate server (requires CORS headers on the remote server)
FrameTrail.init({
    serverPath: 'https://api.example.com/frametrail/',
    // … other options …
}, 'PlayerLauncher');
```

`serverPath` is prepended to any relative URL that starts with `_server/` or `_data/`. Absolute URLs (starting with `http://` or `https://`) are never modified.

### Multiple Instances

Multiple FrameTrail instances can coexist on one page. Each has completely independent state, modules, and storage. All instances are accessible via `FrameTrail.instances`:

```javascript
var ftLeft  = FrameTrail.init({ target: '#left',  startID: 'id-1' }, 'PlayerLauncher');
var ftRight = FrameTrail.init({ target: '#right', startID: 'id-2' }, 'PlayerLauncher');

// FrameTrail.instances[0] === ftLeft
// FrameTrail.instances[1] === ftRight
```

## Debugging

Access modules in the browser console:

```javascript
// Get first instance
var ft = FrameTrail.instances[0];

// Inspect modules
ft.modules();
ft.module('Database').hypervideos;

// Check state
ft.getState();

// Control playback
ft.module('HypervideoController').play();
ft.module('HypervideoController').setCurrentTime(30);
```
