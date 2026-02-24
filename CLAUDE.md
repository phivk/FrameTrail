# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FrameTrail is an open hypervideo environment for creating, annotating, and remixing interactive videos. It's a client-side JavaScript application with an optional PHP backend that uses **JSON files instead of a database** for all data storage. The entire system is portable — copy the `_data` directory between servers and everything works.

FrameTrail can run in three modes: with a PHP server (full multi-user), with the File System Access API for local editing in Chrome/Edge (no server needed), or in-memory using the Download adapter (view + edit + export, no persistence — works everywhere but requires data to be passed via init options).

## Repository Structure

All source code lives in `src/`. The `build/` directory (git-ignored) contains production output.

```
FrameTrail/
├── src/                            # ALL source code (runnable as-is for development)
│   ├── index.html                  # Player/editor entry point
│   ├── resources.html              # Standalone resource manager
│   ├── setup.html                  # First-run setup wizard
│   ├── .htaccess                   # Apache rewrite rules
│   ├── favico.png
│   ├── _lib/                       # Vendored third-party libraries (13 packages)
│   ├── _shared/
│   │   ├── frametrail-core/
│   │   │   ├── frametrail-core.js  # Core: defineModule, defineType, init, state
│   │   │   ├── storage/            # StorageAdapter + Server/Local/Download adapters
│   │   │   ├── _templateModule.js  # Module boilerplate template
│   │   │   └── _templateType.js    # Type boilerplate template
│   │   ├── modules/                # 12 shared modules
│   │   ├── types/                  # 29 resource type definitions
│   │   ├── styles/                 # Global CSS (variables, generic, webfont)
│   │   └── fonts/                  # Webfonts (woff2 only)
│   ├── player/
│   │   ├── modules/                # 18 player-specific modules
│   │   └── types/                  # Player types (Annotation, Overlay, etc.)
│   ├── resourcemanager/
│   │   └── modules/ResourceManagerLauncher/
│   └── _server/                    # PHP backend
├── scripts/
│   └── build.sh                    # Production build script
├── .github/workflows/
│   ├── build.yml                   # CI: build verification on push/PR
│   └── release.yml                 # CD: package + GitHub Release on tags
├── docs/                           # Developer documentation
├── build/                          # Build output (git-ignored)
└── ...                             # README, LICENSE, CONTRIBUTING, etc.
```

## Architecture

### Application Structure

Three HTML entry points in `src/`:
- **`src/index.html`** — Main player/editor (bootstraps via `PlayerLauncher` module)
- **`src/resources.html`** — Standalone resource manager (bootstraps via `ResourceManagerLauncher`)
- **`src/setup.html`** — Initial setup wizard (one-time)

### Core Framework

**Custom Module System** (`src/_shared/frametrail-core/frametrail-core.js`):
- `FrameTrail.defineModule()` — registers modules with init() and onChange() lifecycle methods
- `FrameTrail.defineType()` — registers data types (Annotation, Overlay, Resource types, etc.)
- `FrameTrail.changeState()` / `FrameTrail.getState()` — global state management with change listeners
- Multiple FrameTrail instances can coexist on one page
- No build step for development — all modules loaded directly via `<script>` tags

### Key Directories

**Frontend:**
- `src/_shared/frametrail-core/` — Core framework and module loader
- `src/_shared/frametrail-core/storage/` — Storage adapters (Server, Local, Download)
- `src/_shared/modules/` — Shared modules (Database, UserManagement, ResourceManager, RouteNavigation, StorageManager, Localization, etc.)
- `src/_shared/types/` — Resource type definitions (29 types, all inherit from base Resource)
- `src/player/modules/` — Player modules (HypervideoModel, HypervideoController, AnnotationsController, OverlaysController, Interface, Titlebar, Sidebar, etc.)
- `src/player/types/` — Player types (Annotation, Overlay, Hypervideo, Subtitle, CodeSnippet, ContentView)
- `src/_shared/styles/` — Global CSS (variables.css, generic.css, frametrail-webfont.css)
- `src/_shared/fonts/` — Webfonts in woff2 format (FrameTrail icon font + Titillium Web)
- `src/_lib/` — Vendored third-party libraries

**Backend:**
- `src/_server/ajaxServer.php` — Central AJAX endpoint (switch statement dispatcher)
- `src/_server/user.php` — User management
- `src/_server/files.php` — File upload/download
- `src/_server/hypervideos.php` — Hypervideo CRUD
- `src/_server/annotationfiles.php` — Annotation persistence
- `src/_server/config.php` — Server configuration
- `src/_server/functions.incl.php` — Shared utility functions

**Data Storage** (`_data/` directory — not in git, created at runtime):
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

### Vendored Libraries (`src/_lib/`)

| Directory | Library | Notes |
|-----------|---------|-------|
| `jquery/` | jQuery 3.7.1 | Core DOM/AJAX |
| `jquery.tabs/` | jquery.tabs (custom) | Lightweight drop-in for jQuery UI `.tabs()` |
| `collisiondetection/` | Collision Detection | Overlay collision |
| `interactjs/` | Interact.js | Drag/drop and resize (replaces jQuery UI draggable/resizable) |
| `sortablejs/` | SortableJS | Sortable lists (replaces jQuery UI sortable) |
| `dialog/` | dialog (custom) | Lightweight wrapper around native `<dialog>` (replaces jQuery UI dialog) |
| `leaflet/` | Leaflet | Map rendering (OpenStreetMap) |
| `codemirror6/` | CodeMirror 6 | Code editor (JS/CSS/HTML modes + linting) |
| `hlsjs/` | HLS.js | Adaptive video streaming |
| `d3/` | D3.js v5 | Data visualization |
| `animejs/` | Anime.js | Animation library |
| `quill/` | Quill | Rich text editing (replaces WYSIHTML5) |
| `parsers/` | VTT parser | Subtitle parsing |

### Storage Modes (`storageMode` state)

- `'server'` — PHP backend available, data loaded/saved via AJAX to `src/_server/ajaxServer.php`
- `'local'` — File System Access API active, data read/written via `StorageAdapterLocal` to a user-selected folder
- `'needsFolder'` — File System Access API supported but no folder selected yet; launcher prompts user to pick a `_data` directory
- `'download'` — No persistent storage available (Firefox/Safari, or any browser without File System Access API and no PHP); `StorageAdapterDownload` is used, which stores data in memory and lets users export/download it. Viewing and editing work; `canSave` is `false` (no persistent target); changes are exported via Save As. Data persists only until page reload.

### Application Modes

**Three primary modes controlled by state:**
1. **Player Mode** (`viewMode: 'video'`) — Video playback with annotations/overlays (read-only)
2. **Editor Mode** (`editMode: true`) — Authenticated editing of annotations and overlays
3. **Overview Mode** (`viewMode: 'overview'`) — Gallery view of all hypervideos

**State variables:**
- `editMode` (true/false) — Whether user is editing
- `viewMode` ('video'/'overview') — Current view type
- `storageMode` ('server'/'local'/'needsFolder'/'noStorage') — Active storage backend
- `slidePosition` ('middle'/'bottom'/'top') — Layout positioning
- `sidebarOpen` (true/false) — Sidebar visibility
- `fullscreen` (true/false) — Fullscreen mode
- `viewSize` ([width, height]) — Responsive layout dimensions

### Key Architectural Patterns

1. **Module Pattern**: Modules return public interfaces, private state hidden in closures
2. **Observer Pattern**: State changes trigger module `onChange(stateName, stateValue)` callbacks
3. **Lazy Loading**: Modules initialized on-demand via `FrameTrail.initModule()`
4. **File-Based Persistence**: All data stored as JSON files (no database)
5. **Event-Driven**: Timeline events, user actions broadcast to listeners
6. **W3C Web Annotations**: Uses standardized annotation format with FrameTrail extensions
7. **Guest Mode is orthogonal to storage mode**: `UserManagement.isGuestMode()` is an identity-layer flag — it means "editing without a server account", not "in download mode". A user can be in guest mode in any storage mode (local, download, or server). `StorageManager.canSave()` is the authoritative gate for save UI: it returns `false` for server mode when in guest mode, and delegates to `adapter.canSave` otherwise (`StorageAdapterDownload.canSave` is always `false`; `StorageAdapterLocal.canSave` is `true`). Always use `canSave()` rather than checking `isGuestMode()` or `storageMode` directly in save-related UI.

**Important: FrameTrail instance vs global:**
- The global `FrameTrail` object is the factory/registry. `FrameTrail.module()`, `FrameTrail.changeState()`, etc. are only available on **initialized instances** (the `FrameTrail` parameter passed into `defineModule` callbacks).
- Modules defined via `FrameTrail.defineModule()` receive the instance as their closure argument — they can freely call `FrameTrail.module('X')`.
- Plain classes (e.g. `StorageAdapter` subclasses in `src/_shared/frametrail-core/storage/`) are **not** FrameTrail modules and do **not** have access to any instance. If they need to call module APIs, the caller must pass the FrameTrail instance explicitly.
- Every module must be initialized with `FrameTrail.initModule('ModuleName')` before it can be accessed via `FrameTrail.module('ModuleName')`. Calling `module()` on an uninitialized module returns undefined.

### Data Flow

**Client → Server:** All requests go through `src/_server/ajaxServer.php` with `action` parameter (e.g., `userLogin`, `fileUpload`, `hypervideoAdd`, `annotationfileSave`)

**Client → Local:** `StorageAdapterLocal` uses the File System Access API to read/write JSON files directly in the user's selected `_data` folder

**Client → Download:** `StorageAdapterDownload` enables exporting data as downloadable files when neither server nor File System Access API is available

**Client State Management:**
1. `Database` module loads JSON files via the active storage adapter on app init
2. State changes via `FrameTrail.changeState()` trigger module updates
3. Modules respond to state changes in their `onChange()` method
4. User edits saved back via the storage adapter to update JSON files

### Resource Types

All 29 resource types inherit from the base `Resource` type in `src/_shared/types/Resource/`:

| Type | Description |
|------|-------------|
| ResourceVideo | HTML5 video (with HLS.js support) |
| ResourceImage | Static images |
| ResourceAudio | HTML5 audio |
| ResourceYoutube | YouTube embeds |
| ResourceVimeo | Vimeo embeds |
| ResourceWistia | Wistia embeds |
| ResourceLoom | Loom embeds |
| ResourceTwitch | Twitch embeds |
| ResourceSoundcloud | SoundCloud embeds |
| ResourceSpotify | Spotify embeds |
| ResourceWebpage | Generic iframe embeds |
| ResourceWikipedia | Wikipedia article embeds |
| ResourcePDF | PDF document viewer |
| ResourceText | Rich HTML text |
| ResourceLocation | OpenStreetMap (via Leaflet) |
| ResourceQuiz | Interactive quiz |
| ResourceHotspot | Clickable hotspot |
| ResourceEntity | Linked data entity |
| ResourceXTwitter | X/Twitter embeds |
| ResourceBluesky | Bluesky embeds |
| ResourceMastodon | Mastodon embeds |
| ResourceTiktok | TikTok embeds |
| ResourceReddit | Reddit embeds |
| ResourceFlickr | Flickr embeds |
| ResourceCodepen | CodePen embeds |
| ResourceFigma | Figma embeds |
| ResourceSlideshare | SlideShare embeds |
| ResourceUrlPreview | URL preview cards |

## Development

### Prerequisites

- PHP 7.4+ (for server mode — run `php -S localhost:8080` in `src/`, no Apache needed for local dev)
- Or: Chrome/Edge for local folder mode (File System Access API)
- No build tools required for development — edit files directly in `src/`

### Running Locally

**Development (with server):**
1. Run `php -S localhost:8080` in the `src/` directory
2. Open `http://localhost:8080` — first run opens setup wizard
3. Creates `src/_data/` directory and admin account

**Development (local folder mode):**
1. Open `src/index.html` directly in Chrome or Edge
2. Select or create a `_data` folder when prompted

### Building for Production

```bash
# Install build tools (one-time)
npm install -g terser csso-cli

# Build
bash scripts/build.sh

# Build with version label
bash scripts/build.sh v2.0.0
```

The build script:
1. Concatenates all CSS files in load order → `build/frametrail.css`
2. Inlines woff2 fonts as base64 data URIs into the CSS
3. Concatenates all JS files in load order → `build/frametrail.js`
4. Minifies with terser/csso → `build/frametrail.min.js` + `build/frametrail.min.css`
5. Generates clean HTML entry points that load only the two bundles
6. Copies `_server/`, `.htaccess`, `favico.png`, `LICENSE.md`

### CI/CD

- **Build verification** (`.github/workflows/build.yml`): Runs on every push to `main`/`develop` and every PR. Builds and verifies output.
- **Release packaging** (`.github/workflows/release.yml`): Runs on `v*` tags. Builds, zips, creates GitHub Release with the zip attached.

To create a release:
```bash
git checkout main
git tag v2.0.0
git push origin v2.0.0
# CI creates the GitHub Release automatically
```

### Branching Model

- `main` — Stable release branch, tagged for releases
- `develop` — Integration branch, feature branches merge here
- Feature branches created from `develop`, merged back via PR

### Making Changes

**Adding/Modifying Modules:**
1. Modules located in `src/_shared/modules/` or `src/player/modules/`
2. Follow template in `src/_shared/frametrail-core/_templateModule.js`
3. Register with `FrameTrail.defineModule('ModuleName', function() { ... })`
4. Add `<script>` tag to `src/index.html` (and `src/resources.html` if shared)
5. Add CSS if needed (one stylesheet per module)
6. Add files to `scripts/build.sh` in `JS_FILES`/`CSS_FILES` arrays

**Adding/Modifying Types:**
1. Types located in `src/_shared/types/` or `src/player/types/`
2. Follow template in `src/_shared/frametrail-core/_templateType.js`
3. Register with `FrameTrail.defineType('TypeName', function() { ... })`
4. Add `<script>` and `<link>` tags to HTML files
5. Add files to `scripts/build.sh`

**Modifying Server Logic:**
1. Add new action to switch statement in `src/_server/ajaxServer.php`
2. Implement logic in specialized PHP file
3. Return JSON response with `success`/`error` keys
4. Client-side: Call via `FrameTrail.module('Database').ajax(action, data, callback)`

### File Conventions

**JavaScript:**
- Module structure: Private vars/functions in closure, return public interface
- Lifecycle: `init()` called once, `onChange(changedState, stateValue)` for state updates
- No ES6 modules — uses global `FrameTrail` namespace
- jQuery used extensively (`$`)

**CSS:**
- One stylesheet per module/type in same directory as JS
- Loaded in `<head>` of HTML file
- Global styles in `src/_shared/styles/`
- For `<select>` elements, wrap in a `<div class="custom-select">` to get consistent styled dropdowns with a caret icon (defined in `src/_shared/styles/generic.css`)

**Data Files:**
- All stored in `_data/` directory (not in git)
- JSON format with pretty printing (`JSON_PRETTY_PRINT`)
- Registry files: `_index.json` files list all items in directory
- Direct file I/O in PHP — no database abstraction layer

## Server Configuration

**Key Configuration** (`src/_server/config.php`):
- `$conf["dir"]["data"]` — Data directory location (default: `../_data`)
- Session lifetime controlled by PHP `session.gc_maxlifetime`

**Runtime Configuration** (`_data/config.json`):
- Authentication settings
- Upload restrictions (file types, sizes)
- Theme/UI settings
- Default user roles and permissions
- Custom labels for UI elements

## Localization

**Language Files:** `src/_shared/modules/Localization/locale/`
- Default: `en-US.js`
- German: `de.js`
- Add new languages by creating `{locale}.js` files
- **Important:** Locale files are `.js` files (not `.json`)
- Switch language via `FrameTrail.module('Localization').setLanguage(locale)`
