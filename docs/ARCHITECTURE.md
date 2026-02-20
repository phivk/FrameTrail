# FrameTrail Architecture

This document describes the internal architecture of FrameTrail for developers who want to understand, extend, or contribute to the codebase.

## Core Framework

### The FrameTrail Object

The global `FrameTrail` object is defined in `_shared/frametrail-core/frametrail-core.js` and provides the foundation for the entire application:

```javascript
window.FrameTrail = {
    defineModule:  // Register a module definition
    defineType:    // Register a type definition
    init:          // Create a new FrameTrail instance
    instances:     // Array of all active instances
};
```

### Instance API

When `FrameTrail.init()` is called, it returns an instance with:

```javascript
{
    start:           // Start the application
    initModule:      // Initialize a module
    unloadModule:    // Unload a module
    module:          // Get a module's public interface
    modules:         // Get all loaded modules
    getState:        // Read global state
    changeState:     // Update global state (triggers listeners)
    type:            // Get a type constructor
    newObject:       // Create instance of a type
    triggerEvent:    // Fire custom events
    addEventListener: // Listen to custom events
}
```

## Module System

### Defining Modules

Modules encapsulate related functionality. They're defined with `FrameTrail.defineModule()`:

```javascript
FrameTrail.defineModule('ModuleName', function(FrameTrail) {
    
    // Private scope - variables and functions here are not accessible outside
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
        // Exposed methods/properties
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

### Key Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `Database` | `_shared/modules/` | Loads/saves all JSON data |
| `RouteNavigation` | `_shared/modules/` | URL parsing, environment detection |
| `UserManagement` | `_shared/modules/` | Login, registration, user settings |
| `Localization` | `_shared/modules/` | Multi-language string management |
| `ResourceManager` | `_shared/modules/` | Resource CRUD operations |
| `HypervideoModel` | `player/modules/` | Current hypervideo data model |
| `HypervideoController` | `player/modules/` | Playback control, timing |
| `OverlaysController` | `player/modules/` | Overlay lifecycle management |
| `AnnotationsController` | `player/modules/` | Annotation lifecycle management |
| `Interface` | `player/modules/` | Main UI coordinator |
| `ViewVideo` | `player/modules/` | Video player view |
| `ViewOverview` | `player/modules/` | Hypervideo selection grid |
| `UndoManager` | `player/modules/` | Undo/redo for editing |
| `InterfaceModal` | `player/modules/` | Dialogs, loading screens |

### Module Initialization Order

The `PlayerLauncher` module orchestrates initialization:

```
1. Localization
2. InterfaceModal (shows loading screen)
3. RouteNavigation
4. UserManagement
5. Database
6. TagModel
7. ResourceManager
8. HypervideoFormBuilder
9. HypervideoModel
10. Interface (which initializes sub-modules)
11. HypervideoController (if viewing a hypervideo)
12. UserTraces
13. UndoManager
```

## Type System

### Defining Types

Types define data structures with inheritance support:

```javascript
FrameTrail.defineType('TypeName', function(FrameTrail) {
    return {
        parent: 'ParentType',  // Optional inheritance
        
        constructor: function(data) {
            // Called when creating instances
            this.data = data;
        },
        
        prototype: {
            // Instance methods
            render: function() { /* ... */ },
            
            // Instance properties (via getters/setters)
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
Resource (abstract)
├── ResourceImage
├── ResourceVideo
├── ResourceAudio
├── ResourceYoutube
├── ResourceVimeo
├── ResourceWebpage
├── ResourceWikipedia
├── ResourceLocation
├── ResourcePDF
├── ResourceText
├── ResourceQuiz
├── ResourceHotspot
└── ResourceEntity

Overlay
Annotation
CodeSnippet
Hypervideo
Subtitle
```

Each Resource type implements:
- `renderContent()` - Display the resource
- `renderThumb()` - Thumbnail for resource manager
- `renderPropertiesControls()` - Editing UI for overlays
- `renderTimeControls()` - Editing UI for annotations

## State Management

### Global State

State is managed centrally and changes trigger reactive updates:

```javascript
// Read state
var editMode = FrameTrail.getState('editMode');
var allState = FrameTrail.getState(); // Returns full state object

// Update state (triggers onChange handlers in all modules)
FrameTrail.changeState('editMode', true);

// Batch update
FrameTrail.changeState({
    editMode: true,
    viewMode: 'video'
});
```

### Core State Properties

| Property | Type | Description |
|----------|------|-------------|
| `target` | String | CSS selector for mount point |
| `editMode` | Boolean/String | `false`, `'overlays'`, `'annotations'`, etc. |
| `viewMode` | String | `'video'`, `'overview'`, `'resources'` |
| `loggedIn` | Boolean | User authentication status |
| `username` | String | Current user's name |
| `fullscreen` | Boolean | Fullscreen state |
| `sidebarOpen` | Boolean | Sidebar visibility |
| `viewSize` | Array | `[width, height]` of viewport |
| `unsavedChanges` | Boolean | Dirty flag for editing |
| `slidePosition` | String | `'left'`, `'middle'`, `'right'` |

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

## Data Model

### File-Based Storage

All data is stored as JSON files in `_data/`:

```
_data/
├── config.json           # Instance configuration
├── users.json            # User accounts
├── tagdefinitions.json   # Tag definitions
├── resources/
│   ├── _index.json       # Resource metadata
│   └── [files...]        # Uploaded media
└── hypervideos/
    ├── _index.json       # Hypervideo list
    └── [id]/
        ├── hypervideo.json    # Hypervideo data + content
        └── annotations/
            ├── _index.json    # Annotation file index
            └── [userId].json  # Per-user annotations
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
    "layoutArea": { /* layout settings */ },
    "hidden": false,
    "theme": "default"
  },
  "clips": [
    {
      "resourceId": "resource-id",
      "duration": 120,
      "start": 0,
      "end": 120
    }
  ],
  "contents": [
    /* overlays and code snippets */
  ],
  "subtitles": {
    "en": "subtitles/en.vtt"
  },
  "globalEvents": { /* event handlers */ },
  "customCSS": ""
}
```

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

### Overlay/Annotation Structure

```json
{
  "name": "Info Box",
  "type": "text",
  "src": "<p>HTML content</p>",
  "start": 10.5,
  "end": 25.0,
  "position": {
    "top": 10,
    "left": 20,
    "width": 30,
    "height": 20
  },
  "attributes": {
    "text": "<p>Content</p>"
  },
  "events": {}
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

UI components use standard jQuery event handling:

```javascript
$('.myButton').on('click', function(evt) {
    evt.preventDefault();
    // handle click
});
```

## Environment Detection

The `RouteNavigation` module provides environment info:

```javascript
var env = FrameTrail.module('RouteNavigation').environment;

env.server    // Boolean: true if running on HTTP server
env.hostname  // String: current hostname
env.iframe    // Boolean: true if embedded in iframe
```

Use this to conditionally enable features:

```javascript
if (!FrameTrail.module('RouteNavigation').environment.server) {
    // Hide editing features when running locally
    StartEditButton.hide();
}
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
| `annotations` | Annotation ID (reserved) |

### Programmatic Navigation

```javascript
// Get current hypervideo
var id = FrameTrail.module('RouteNavigation').hypervideoID;

// Change hypervideo (updates URL and loads new data)
FrameTrail.module('HypervideoModel').updateHypervideo(newId);

// Set playback time
FrameTrail.module('RouteNavigation').hashTime = 45.5;
```

## CSS Architecture

### CSS Custom Properties (Theming)

Themes are defined in `_shared/styles/variables.css`:

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

- `_shared/styles/generic.css` - Common styles
- `_shared/styles/variables.css` - Theme definitions
- `player/types/[Type]/style.css` - Type-specific styles
- `_shared/types/[Type]/style.css` - Shared type styles

## Backend (PHP)

### API Endpoints

All AJAX requests go through `_server/ajaxServer.php`:

| Action | Description |
|--------|-------------|
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

### File Handling

- `_server/files.php` - File upload, transcoding
- `_server/user.php` - User management
- `_server/hypervideo.php` - Hypervideo CRUD
- `_server/config.php` - Configuration

### Sessions

PHP sessions are used for authentication. Session data is stored in `$_SESSION['ohv']`.

## Performance Considerations

1. **Lazy Loading**: Modules are only initialized when needed
2. **State Batching**: Multiple `changeState()` calls in the same thread are batched
3. **DOM Caching**: jQuery elements are cached in module scope
4. **JSON Caching**: `config.allowCaching` controls AJAX caching

## Debugging Tips

1. Access modules in browser console:
   ```javascript
   FrameTrail.instances[0].module('Database').hypervideos
   ```

2. Inspect state:
   ```javascript
   FrameTrail.instances[0].getState()
   ```

3. Watch state changes by adding temporary `onChange` handlers

4. Check `_data/` folder for actual saved data
