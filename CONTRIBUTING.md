# Contributing to FrameTrail

Thank you for your interest in contributing to FrameTrail! This guide covers development setup, project structure, coding conventions, and the contribution workflow.

## Development Setup

### Prerequisites

- PHP 7.4+ (run `php -S localhost:8080` in `src/` for local dev — no Apache needed)
- A modern browser (Chrome or Firefox)
- Git

For building production bundles (optional):
- Node.js 20+
- `npm install -g terser csso-cli`

### Getting Started

1. Clone the repository and check out `develop`:
   ```bash
   git clone https://github.com/OpenHypervideo/FrameTrail.git
   cd FrameTrail
   git checkout develop
   ```

2. Point your web server at the `src/` directory:
   - **XAMPP/MAMP/WAMP**: Symlink or copy `src/` into your `htdocs` directory
   - **Apache vhost**: Set `DocumentRoot` to the `src/` directory
   - **Docker**: Any Apache+PHP image with `src/` mounted as the document root

3. Open `http://localhost/your-path/` in your browser

4. Complete the setup wizard to create an admin account

That's it. Edit any file in `src/`, reload the browser, and your changes are live. No build step needed during development.

### Alternative: Local Folder Mode

If you don't have Apache+PHP, you can develop using local folder mode:

1. Open `src/index.html` directly in Chrome or Edge
2. Select a `_data` folder when prompted (create one if needed)
3. Editing works via the File System Access API — no server required

Note: Some features (file uploads, user management) require the PHP backend.

## Project Structure

```
FrameTrail/
├── src/                            # All source code (runnable as-is)
│   ├── index.html                  # Player/editor entry point (~60 script/link tags)
│   ├── resources.html              # Standalone resource manager
│   ├── setup.html                  # First-run setup wizard
│   ├── _lib/                       # Vendored third-party libraries (10 packages)
│   │   ├── tabsjs/                # FTTabs (custom vanilla-JS tab widget)
│   │   ├── collisiondetection/    # Overlay collision detection
│   │   ├── interactjs/            # Drag/drop and resize (overlay editing)
│   │   ├── sortablejs/            # Sortable lists
│   │   ├── dialog/                # Lightweight native <dialog> wrapper
│   │   ├── leaflet/               # Leaflet (maps)
│   │   ├── codemirror6/           # CodeMirror 6 (JS/CSS/HTML + linting)
│   │   ├── hlsjs/                 # HLS.js (adaptive streaming)
│   │   ├── quill/                 # Quill (rich text editing)
│   │   └── parsers/               # VTT subtitle parser
│   ├── _shared/
│   │   ├── frametrail-core/       # Core framework (module system, state, types)
│   │   │   ├── frametrail-core.js # defineModule, defineType, init, changeState
│   │   │   └── storage/           # StorageAdapter, StorageAdapterServer/Local/Download
│   │   ├── modules/               # Shared modules
│   │   │   ├── Database/          # Data loading and persistence
│   │   │   ├── Localization/      # i18n (en, de)
│   │   │   ├── ResourceManager/   # Resource CRUD
│   │   │   ├── RouteNavigation/   # URL parsing, environment detection
│   │   │   ├── StorageManager/    # Storage mode selection
│   │   │   ├── UserManagement/    # Login, registration
│   │   │   └── ...                # 12 modules total
│   │   ├── types/                 # Resource type definitions (29 types)
│   │   │   ├── Resource/          # Base type (abstract)
│   │   │   ├── ResourceVideo/     # HTML5 video
│   │   │   ├── ResourceYoutube/   # YouTube embed
│   │   │   └── ...
│   │   ├── styles/                # Global CSS (variables, generic, webfont)
│   │   └── fonts/                 # Webfonts (FrameTrail icons + Titillium Web)
│   ├── player/
│   │   ├── modules/               # Player-specific modules (18 modules)
│   │   │   ├── PlayerLauncher/    # Bootstrap and initialization
│   │   │   ├── HypervideoModel/   # Current hypervideo data
│   │   │   ├── HypervideoController/ # Playback control
│   │   │   ├── Interface/         # Main UI layout
│   │   │   └── ...
│   │   └── types/                 # Annotation, Overlay, Hypervideo, Subtitle, etc.
│   ├── resourcemanager/
│   │   └── modules/ResourceManagerLauncher/
│   └── _server/                   # PHP backend
│       ├── ajaxServer.php         # Central AJAX dispatcher
│       ├── config.php             # Server configuration
│       ├── user.php               # User management
│       ├── files.php              # File upload/download
│       ├── hypervideos.php        # Hypervideo CRUD
│       └── ...
├── scripts/
│   └── build.sh                   # Production build (concat + minify)
├── .github/workflows/
│   ├── build.yml                  # CI: build verification on push/PR
│   └── release.yml                # CD: build + package on version tags
├── docs/                          # Developer documentation
├── build/                         # Build output (git-ignored)
├── CLAUDE.md                      # AI assistant project guide
├── CONTRIBUTING.md                # This file
├── README.md
└── LICENSE.md
```

## Architecture Overview

FrameTrail uses a custom module system — no ES6 modules, no bundler. All code is loaded via `<script>` tags in the HTML entry points.

**Key concepts:**

- **Modules** (`FrameTrail.defineModule`) — Encapsulate business logic and UI. Private state in closures, public interface returned.
- **Types** (`FrameTrail.defineType`) — Define data structures with inheritance (e.g., `ResourceYoutube` extends `Resource`).
- **State** (`FrameTrail.changeState` / `getState`) — Centralized reactive state. Modules declare `onChange` handlers that fire automatically.
- **Storage modes** — `server` (PHP/AJAX), `local` (File System Access API), `needsFolder` (waiting for folder selection), `noStorage` (read-only fallback).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture documentation.

## Making Changes

### Code Style

- **Indentation:** 4 spaces
- **Naming:** camelCase for variables and functions
- **DOM:** Plain DOM APIs (`document.createElement`, `addEventListener`, `classList`, etc.) — no jQuery
- **Comments:** JSDoc-style for public methods. First-person "I do X" convention for class descriptions.
- Follow existing patterns in the codebase

### Adding a Module

1. Create your module directory in `src/_shared/modules/` (shared) or `src/player/modules/` (player-specific)
2. Create `module.js` following the `FrameTrail.defineModule` pattern (see `src/_shared/frametrail-core/_templateModule.js`)
3. Create `style.css` if the module has UI
4. Add `<script>` and `<link>` tags to `src/index.html` (and `src/resources.html` if shared)
5. Add the files to `scripts/build.sh` in the `JS_FILES` and `CSS_FILES` arrays
6. Initialize your module in the appropriate launcher

### Adding a Resource Type

1. Create `src/_shared/types/ResourceMyType/type.js` and `style.css`
2. Inherit from the base `Resource` type
3. Add to HTML entry points and `scripts/build.sh`

See [docs/EXTENDING.md](docs/EXTENDING.md) for the complete guide.

### Keeping Build Script in Sync

When you add new JS or CSS files, you must add them to both:
1. The `<script>`/`<link>` tags in `src/index.html` (and `src/resources.html` if applicable)
2. The `JS_FILES` / `CSS_FILES` arrays in `scripts/build.sh`

Order matters — libraries before core, core before modules, parent types before children.

## Build System

The build script (`scripts/build.sh`) reads from `src/`, concatenates all JS and CSS in the correct load order, inlines webfonts as base64, minifies with terser/csso, and generates clean HTML entry points that load the two bundles.

```bash
# Run the build
bash scripts/build.sh

# Run with a version label
bash scripts/build.sh v2.0.0
```

Output goes to `build/` (git-ignored). The build is verified automatically by CI on every push and PR.

## CI/CD

### Build Verification

Every push to `main` or `develop` and every PR triggers the [build workflow](.github/workflows/build.yml):
- Checks out code, installs terser + csso
- Runs `scripts/build.sh`
- Verifies all expected output files exist
- Uploads the build as a downloadable artifact (7-day retention)

A green checkmark on your commit/PR means the build succeeded.

### Releases

Releases are created by pushing a version tag:

```bash
git checkout main
git tag v2.0.0
git push origin v2.0.0
```

The [release workflow](.github/workflows/release.yml) automatically builds, packages a zip, and creates a GitHub Release with the zip attached. Release notes are auto-generated from merged PRs.

## Branching Model

- **`main`** — Stable release branch. Tagged for releases.
- **`develop`** — Integration branch. Feature branches merge here.
- **Feature branches** — Created from `develop`, merged back via PR.

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-feature
   ```

2. Make your changes, commit with clear messages

3. Push and open a PR against `develop`:
   ```bash
   git push -u origin feature/my-feature
   ```

4. CI runs automatically — wait for the green checkmark

5. After review and merge, delete the feature branch

### Releasing

When `develop` is ready for release:

1. Merge `develop` into `main`
2. Tag with a version number: `git tag v2.x.x`
3. Push the tag: `git push origin v2.x.x`
4. CI creates the GitHub Release automatically

## Testing

There is no automated test suite. Test manually:

1. Test in Chrome and Firefox
2. Test with and without edit mode
3. Test server mode and local folder mode
4. Test with different resource types
5. Check the browser console for errors
6. Run the build script and verify the build output works

## Submitting Changes

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes with clear commit messages
4. Push to your fork and open a PR against `develop`
5. Include in your PR:
   - Description of what changed and why
   - Screenshots/GIFs for UI changes
   - Steps to test

## Reporting Issues

When reporting bugs, please include:
- Browser and version
- Storage mode (server, local folder, read-only)
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if relevant)

## License

By contributing to FrameTrail, you agree that your contributions will be licensed under the project's dual MIT/GPL v3 license.
