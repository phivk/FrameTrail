# FrameTrail Data Model

This document describes the JSON data structures used by FrameTrail.

## File Structure

```
_data/
├── config.json                    # Instance configuration
├── users.json                     # User accounts
├── tagdefinitions.json            # Tag definitions
├── global.css                     # Custom global CSS
├── resources/
│   ├── _index.json                # Resource metadata index
│   └── [uploaded files]           # Media files
└── hypervideos/
    ├── _index.json                # Hypervideo list (legacy, now generated)
    └── [hypervideo-id]/
        ├── hypervideo.json        # Hypervideo data
        └── annotations/
            ├── _index.json        # Annotation files index
            └── [user-id].json     # Per-user annotations
```

## config.json

Instance-wide configuration:

```json
{
    "defaultUserRole": "user",
    "userNeedsConfirmation": false,
    "allowUploads": true,
    "allowCollaboration": true,
    "alwaysForceLogin": false,
    "allowCaching": true,
    "allowVideoOptimization": true,
    "theme": "default",
    "userColorCollection": [
        "597081", "339966", "16a09c", "cd4436",
        "0073a6", "8b5180", "999933", "CC3399"
    ],
    "mediaOptimization": {
        "enabled": true,
        "maxWidth": 1920,
        "maxHeight": 1080,
        "quality": 85,
        "useFFmpeg": false
    }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `defaultUserRole` | String | Role assigned to new users: `"user"`, `"admin"` |
| `userNeedsConfirmation` | Boolean | Require admin approval for new accounts |
| `allowUploads` | Boolean | Allow file uploads |
| `allowCollaboration` | Boolean | Allow multiple users to annotate |
| `alwaysForceLogin` | Boolean | Require login to view content |
| `allowCaching` | Boolean | Enable AJAX response caching |
| `theme` | String | Default color theme |
| `userColorCollection` | Array | Available user colors (hex without #) |
| `mediaOptimization` | Object | Image/video processing settings |

## users.json

User account data:

```json
{
    "user-id-string": {
        "name": "Display Name",
        "mail": "user@example.com",
        "passwd": "hashed-password",
        "role": "admin",
        "color": "597081",
        "registrationDate": 1234567890,
        "active": true
    }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display name |
| `mail` | String | Email address |
| `passwd` | String | Hashed password |
| `role` | String | `"user"` or `"admin"` |
| `color` | String | Hex color without # |
| `registrationDate` | Integer | Unix timestamp |
| `active` | Boolean | Account enabled (for admin approval flow) |

## tagdefinitions.json

Tag definitions with multi-language support:

```json
{
    "tag-name": {
        "en": {
            "label": "Tag Label",
            "description": "Description of this tag"
        },
        "de": {
            "label": "Tag-Bezeichnung",
            "description": "Beschreibung dieses Tags"
        }
    }
}
```

## resources/_index.json

Resource metadata index:

```json
{
    "resource-id": {
        "name": "Resource Name",
        "type": "image",
        "src": "filename.jpg",
        "thumb": "filename_thumb.jpg",
        "licenseType": "cc-by-sa",
        "attributes": {},
        "tags": ["tag1", "tag2"]
    }
}
```

### Resource Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `image` | Static image | `src` |
| `video` | HTML5 video | `src` |
| `audio` | HTML5 audio | `src` |
| `youtube` | YouTube video | `src` (video ID) |
| `vimeo` | Vimeo video | `src` (video ID) |
| `webpage` | Embedded iframe | `src` (URL) |
| `wikipedia` | Wikipedia article | `src` (article name) |
| `location` | OpenStreetMap | `attributes.lat`, `attributes.lng` |
| `pdf` | PDF document | `src` |
| `text` | Rich text/HTML | `attributes.text` |
| `quiz` | Interactive quiz | `attributes.quiz` |
| `hotspot` | Clickable hotspot | `attributes.linkUrl` |
| `entity` | Linked data entity | `src` (entity URI) |

### Type-Specific Attributes

**Location:**
```json
{
    "attributes": {
        "lat": 52.5200,
        "lng": 13.4050,
        "boundingBox": "[[lat1,lng1],[lat2,lng2]]"
    }
}
```

**Text:**
```json
{
    "attributes": {
        "text": "<p>HTML content</p>"
    }
}
```

**Quiz:**
```json
{
    "attributes": {
        "quiz": {
            "question": "Question text?",
            "answers": [
                {"text": "Answer 1", "correct": true},
                {"text": "Answer 2", "correct": false}
            ]
        }
    }
}
```

## hypervideo.json

Complete hypervideo data:

```json
{
    "meta": {
        "name": "Hypervideo Title",
        "description": "Description text",
        "thumb": "thumbnail.jpg",
        "creator": "username",
        "creatorId": "user-id",
        "created": 1234567890,
        "lastchanged": 1234567890
    },
    "config": {
        "layoutArea": {
            "areaTop": [],
            "areaBottom": [],
            "areaLeft": [],
            "areaRight": []
        },
        "hidden": false,
        "slidingMode": "overlay"
    },
    "clips": [
        {
            "resourceId": "video-resource-id",
            "duration": 120.5,
            "start": 0,
            "end": 120.5
        }
    ],
    "contents": [
        /* Overlays and CodeSnippets */
    ],
    "subtitles": {
        "en": "subtitles/en.vtt",
        "de": "subtitles/de.vtt"
    },
    "globalEvents": {
        "onReady": "",
        "onPlay": "",
        "onPause": "",
        "onEnded": ""
    },
    "customCSS": ""
}
```

### Meta Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Display title |
| `description` | String | Description/summary |
| `thumb` | String | Thumbnail filename |
| `creator` | String | Creator's display name |
| `creatorId` | String | Creator's user ID |
| `created` | Integer | Creation timestamp |
| `lastchanged` | Integer | Last modification timestamp |

### Config Object

| Field | Type | Description |
|-------|------|-------------|
| `layoutArea` | Object | Content view configuration per area |
| `hidden` | Boolean | Hide from overview listing |
| `slidingMode` | String | `"overlay"` or `"adjust"` |

### Clips Array

For standard videos, this contains one clip. Canvas/time container mode omits `resourceId`:

```json
{
    "clips": [
        {
            "duration": 300,
            "start": 0,
            "end": 300
        }
    ]
}
```

### Contents Array (Overlays)

Overlays in W3C Web Annotation format:

```json
{
    "frametrail:type": "Overlay",
    "body": {
        "frametrail:type": "text",
        "frametrail:name": "Info Box",
        "value": "<p>Content</p>",
        "frametrail:thumb": null,
        "frametrail:attributes": {
            "text": "<p>Content</p>"
        }
    },
    "target": {
        "selector": {
            "value": "t=10.5,25.0"
        }
    },
    "frametrail:position": {
        "top": 10,
        "left": 20,
        "width": 30,
        "height": 20
    },
    "created": 1234567890,
    "creator": {
        "nickname": "username",
        "id": "user-id"
    }
}
```

### Contents Array (Code Snippets)

```json
{
    "frametrail:type": "CodeSnippet",
    "body": {
        "value": "console.log('Hello');",
        "frametrail:name": "Log Message",
        "frametrail:snippet": "custom"
    },
    "target": {
        "selector": {
            "value": "t=15.0"
        }
    }
}
```

### Global Events

JavaScript code executed at hypervideo lifecycle events:

| Event | Triggered When |
|-------|----------------|
| `onReady` | Hypervideo fully loaded |
| `onPlay` | Playback starts |
| `onPause` | Playback pauses |
| `onEnded` | Playback reaches end |

## annotations/_index.json

Index of annotation files per user:

```json
{
    "mainAnnotation": null,
    "annotationfiles": {
        "user-id": {
            "name": "username",
            "color": "597081",
            "src": "user-id.json"
        }
    }
}
```

## annotations/[user-id].json

User's annotations in W3C Web Annotation format:

```json
[
    {
        "body": {
            "frametrail:type": "text",
            "frametrail:name": "My Annotation",
            "value": "<p>Note content</p>",
            "frametrail:attributes": {
                "text": "<p>Note content</p>"
            },
            "frametrail:thumb": null
        },
        "target": {
            "selector": {
                "value": "t=30.0,45.0"
            }
        },
        "created": "2024-01-15T10:30:00Z",
        "creator": {
            "nickname": "username",
            "id": "user-id"
        },
        "frametrail:tags": ["important", "review"]
    }
]
```

## Time Format

Time ranges use Media Fragment URI syntax:

```
t=start,end
```

Where `start` and `end` are seconds (can include decimals):
- `t=10,20` - From 10s to 20s
- `t=10.5,25.75` - From 10.5s to 25.75s
- `t=0` - Point in time (code snippets)

## Position Format

Overlay positions are percentages relative to video area:

```json
{
    "top": 10,      // 10% from top
    "left": 20,     // 20% from left
    "width": 30,    // 30% of video width
    "height": 20    // 20% of video height
}
```

## License Types

| Value | Meaning |
|-------|---------|
| `"cc-by"` | Creative Commons Attribution |
| `"cc-by-sa"` | CC Attribution-ShareAlike |
| `"cc-by-nc"` | CC Attribution-NonCommercial |
| `"cc-by-nc-sa"` | CC Attribution-NonCommercial-ShareAlike |
| `"cc-by-nd"` | CC Attribution-NoDerivs |
| `"cc-by-nc-nd"` | CC Attribution-NonCommercial-NoDerivs |
| `"cc0"` | Public Domain |
| `"all-rights-reserved"` | All Rights Reserved |

## ID Generation

IDs are typically generated as:
- **User IDs**: UUID or custom format
- **Resource IDs**: `userId_timestamp_sanitizedName`
- **Hypervideo IDs**: Auto-incrementing or UUID
- **Timestamps**: Unix timestamp in milliseconds for `created` fields
