# Initializing FrameTrail

This guide covers the different ways to initialize and embed FrameTrail.

## Standard Installation

The standard installation uses the built-in HTML files with a full FrameTrail server backend.

### index.html

The main entry point loads the player application:

```html
<script>
$(document).ready(function() {
    FrameTrail.init({
        target: 'body'
    }, 'PlayerLauncher');
});
</script>
```

This will:
1. Load configuration from `_data/config.json`
2. Parse the URL hash for `#hypervideo=ID`
3. Show the overview if no hypervideo is specified, or load the hypervideo

### resources.html

Standalone resource manager:

```html
<script>
$(document).ready(function() {
    FrameTrail.init({
        target: 'body'
    }, 'ResourceManagerLauncher');
});
</script>
```

## Embedding in Your Page

### Basic Embedding

Add FrameTrail to an existing page by specifying a target container:

```html
<div id="frametrail-container"></div>

<script>
$(document).ready(function() {
    FrameTrail.init({
        target: '#frametrail-container',
        startID: 'your-hypervideo-id'
    }, 'PlayerLauncher');
});
</script>
```

### iFrame Embedding

For isolation, embed via iframe:

```html
<iframe 
    src="https://your-server.com/frametrail/#hypervideo=abc123"
    width="800" 
    height="600"
    frameborder="0"
    allowfullscreen>
</iframe>
```

FrameTrail automatically detects iframe embedding and adjusts behavior.

## Initialization Options

### Complete Options Reference

```javascript
FrameTrail.init({
    // Mount point (CSS selector or DOM element)
    target: '#container',
    
    // Hypervideo to load initially (skips overview)
    startID: 'hypervideo-id',
    
    // Pre-loaded configuration (skips _data/config.json)
    config: {
        defaultUserRole: 'user',
        userNeedsConfirmation: false,
        allowUploads: true,
        allowCollaboration: true,
        alwaysForceLogin: false,
        theme: 'default'
    },
    
    // Pre-loaded user data (skips _data/users.json)
    users: {
        'user-id': {
            name: 'Username',
            mail: 'user@example.com',
            role: 'admin',
            color: '597081'
        }
    },
    
    // Pre-loaded resource data (skips _data/resources/_index.json)
    resources: {
        'resource-id': {
            name: 'My Video',
            type: 'video',
            src: 'video.mp4'
        }
    },
    
    // Pre-loaded hypervideo content (multiple formats supported - see below)
    contents: [...],
    
    // UI language
    language: 'en-US',  // or 'de'
    
    // Tag definitions
    tagdefinitions: {
        'tag-name': {
            'en': { label: 'Tag Label', description: 'Description' }
        }
    },
    
    // Custom content targets for external rendering
    contentTargets: {
        'AnnotationContainer': '#my-annotations-div'
    }
    
}, 'PlayerLauncher');
```

## Content Loading Methods

### Method 1: Server Path (Default)

Load from a FrameTrail server:

```javascript
FrameTrail.init({
    target: '#container'
    // Contents loaded from _data/hypervideos/
}, 'PlayerLauncher');
```

### Method 2: Custom Path

Point to a different server location:

```javascript
FrameTrail.init({
    target: '#container',
    contents: 'https://other-server.com/frametrail-data/'
}, 'PlayerLauncher');
```

### Method 3: Array of External URLs

Load hypervideos from external JSON files:

```javascript
FrameTrail.init({
    target: '#container',
    startID: '0',  // Index in the array
    contents: [
        {
            hypervideo: 'https://example.com/hypervideo1.json'
        },
        {
            hypervideo: 'https://example.com/hypervideo2.json',
            annotations: [
                'https://example.com/annotations1.json',
                'https://example.com/annotations2.json'
            ]
        }
    ]
}, 'PlayerLauncher');
```

### Method 4: Inline Data

Embed hypervideo data directly:

```javascript
FrameTrail.init({
    target: '#container',
    startID: '0',
    contents: [
        {
            hypervideo: {
                meta: {
                    name: 'My Hypervideo',
                    description: 'Inline hypervideo',
                    creator: 'Anonymous',
                    creatorId: 'anonymous',
                    created: Date.now(),
                    lastchanged: Date.now()
                },
                config: {
                    layoutArea: {},
                    hidden: false
                },
                clips: [
                    {
                        resourceId: 'video-resource',
                        duration: 120,
                        start: 0,
                        end: 120
                    }
                ],
                contents: [
                    // Overlays
                    {
                        "frametrail:type": "Overlay",
                        body: {
                            "frametrail:type": "text",
                            "frametrail:name": "Info",
                            value: "<p>Hello World</p>",
                            "frametrail:attributes": {
                                text: "<p>Hello World</p>"
                            }
                        },
                        target: {
                            selector: { value: "t=10,20" }
                        },
                        "frametrail:position": {
                            top: 10, left: 10, width: 30, height: 20
                        }
                    }
                ],
                subtitles: {},
                globalEvents: {},
                customCSS: ''
            }
        }
    ],
    resources: {
        'video-resource': {
            name: 'Main Video',
            type: 'youtube',
            src: 'dQw4w9WgXcQ'  // YouTube video ID
        }
    }
}, 'PlayerLauncher');
```

## Read-Only Mode

For viewing without editing capabilities (works without PHP backend):

```javascript
FrameTrail.init({
    target: '#container',
    startID: '0',
    contents: [/* inline or external data */],
    config: {
        allowUploads: false,
        allowCollaboration: false
    }
}, 'PlayerLauncher');
```

Note: Firefox supports local file access. Chrome requires `--allow-file-access-from-files` flag.

## Multiple Instances

You can run multiple FrameTrail instances on the same page:

```javascript
// First instance
var instance1 = FrameTrail.init({
    target: '#player1',
    startID: 'hypervideo-1'
}, 'PlayerLauncher');

// Second instance
var instance2 = FrameTrail.init({
    target: '#player2',
    startID: 'hypervideo-2'
}, 'PlayerLauncher');

// Access instances
console.log(FrameTrail.instances); // [instance1, instance2]
```

## URL Parameters

### Hash Parameters

Control playback via URL hash:

```
index.html#hypervideo=abc123&t=45.5
```

| Parameter | Description |
|-----------|-------------|
| `hypervideo` | ID of hypervideo to load |
| `t` | Start time in seconds |

### Programmatic Control

After initialization, control via API:

```javascript
// Get the instance
var ft = FrameTrail.instances[0];

// Change hypervideo
ft.module('HypervideoModel').updateHypervideo('new-id');

// Control playback
ft.module('HypervideoController').play();
ft.module('HypervideoController').pause();
ft.module('HypervideoController').setCurrentTime(30);

// Get current time
var time = ft.module('HypervideoController').currentTime;

// Check state
var isPlaying = ft.getState('playing');
var editMode = ft.getState('editMode');
```

## External Video Sources

### YouTube

```javascript
resources: {
    'my-youtube': {
        name: 'YouTube Video',
        type: 'youtube',
        src: 'dQw4w9WgXcQ',  // Video ID only
        thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg'
    }
}
```

### Vimeo

```javascript
resources: {
    'my-vimeo': {
        name: 'Vimeo Video',
        type: 'vimeo',
        src: '123456789',  // Video ID only
        thumb: 'thumbnail.jpg'
    }
}
```

### HTML5 Video

```javascript
resources: {
    'my-video': {
        name: 'Local Video',
        type: 'video',
        src: 'video.mp4',  // Relative to _data/resources/
        thumb: 'video_thumb.jpg'
    }
}
```

### External URL

```javascript
resources: {
    'external-video': {
        name: 'External Video',
        type: 'video',
        src: 'https://example.com/video.mp4',
        thumb: 'https://example.com/thumb.jpg'
    }
}
```

## Canvas/Time Container Mode

Create hypervideos without a video source (image slideshows, presentations):

```javascript
contents: [{
    hypervideo: {
        meta: { /* ... */ },
        config: { /* ... */ },
        clips: [{
            // No resourceId = canvas mode
            duration: 300,  // 5 minutes
            start: 0,
            end: 300
        }],
        contents: [/* overlays */]
    }
}]
```

## Responsive Embedding

FrameTrail automatically handles window resizing. For responsive containers:

```html
<style>
    #frametrail-container {
        width: 100%;
        height: 0;
        padding-bottom: 56.25%; /* 16:9 aspect ratio */
        position: relative;
    }
    #frametrail-container .frametrail-body {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>

<div id="frametrail-container"></div>
```

## Theming

Apply a built-in theme:

```javascript
FrameTrail.init({
    target: '#container',
    config: {
        theme: 'bright'  // 'default', 'dark', 'bright', 'blue', 'green', 'orange', 'grey'
    }
}, 'PlayerLauncher');
```

Or via data attribute after init:

```javascript
$('#container').attr('data-frametrail-theme', 'bright');
```

## Debug Mode

Access internals via browser console:

```javascript
// Get first instance
var ft = FrameTrail.instances[0];

// Inspect all modules
ft.modules();

// Get specific module
ft.module('Database');

// View all state
ft.getState();

// View loaded hypervideos
ft.module('Database').hypervideos;

// View current hypervideo data
ft.module('HypervideoModel').overlays;
ft.module('HypervideoModel').annotations;
```
