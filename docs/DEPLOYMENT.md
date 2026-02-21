# Deploying FrameTrail

This guide covers the three ways to run FrameTrail (server, local folder, and in-memory), how to build from source, and the release process.

## Deployment Options

### Option 1: Server Deployment (PHP)

Full multi-user mode with file uploads, user management, and collaboration.

**Requirements:**
- PHP 7.4+
- The directory needs write permissions so FrameTrail can create `_data/`

**Quickest local setup:**
```bash
php -S localhost:8080
```
Then open `http://localhost:8080`. No Apache, no XAMPP needed if PHP is installed.

**Public / production server:** Use Apache (`.htaccess` included and handles security rules) or nginx + PHP-FPM (add a deny rule for `_data/` in your nginx config).

**Steps:**

1. Download the [latest release](https://github.com/OpenHypervideo/FrameTrail/releases) zip
2. Extract to your web server directory (e.g., `/var/www/html/frametrail/`)
3. Set write permissions:
   ```bash
   chmod -R 775 /var/www/html/frametrail/
   chown -R www-data:www-data /var/www/html/frametrail/
   ```
4. Open in your browser (e.g., `http://example.com/frametrail/`)
5. Follow the setup wizard to create an admin account
6. The wizard creates the `_data/` directory with initial configuration

**What's in the release zip:**
- `frametrail.min.js` + `frametrail.min.css` — Minified bundles
- `frametrail.js` + `frametrail.css` — Unminified bundles (for debugging)
- `index.html`, `resources.html`, `setup.html` — Entry points
- `_server/` — Full PHP backend
- `.htaccess` — Apache rewrite rules
- `favico.png`, `README.md`, `LICENSE.md`

### Option 2: Local Folder Mode (No Server)

Full editing without a server. Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write files directly on disk.

**Requirements:**
- Chrome or Edge (the File System Access API is not supported in Firefox or Safari)

**Steps:**

1. Download and extract FrameTrail (either a release zip or the `src/` directory)
2. Open `index.html` directly in Chrome or Edge
3. FrameTrail detects the local environment and prompts you to select a `_data` folder
4. Select an existing `_data` folder or create a new empty folder
5. Full editing is available — all changes are saved directly to the selected folder

**How it works:**

The `StorageAdapterLocal` class uses the File System Access API (`showDirectoryPicker`, `FileSystemDirectoryHandle`, etc.) to read and write JSON files and uploaded media. The browser asks for permission the first time you access a folder, then remembers it for the session.

**Limitations:**
- Identity is name-only (a login dialog prompts for a display name before entering edit mode; no account or password required)
- No PHP-based file processing (image optimization, video transcoding)
- Browser must support File System Access API (Chrome/Edge only)

### Option 3: In-Memory Mode (All Browsers)

No server, no file system access required. FrameTrail automatically falls back to this mode when running in Firefox, Safari, or any browser without the File System Access API and no PHP backend.

**Requirements:**
- Any modern browser (Chrome, Firefox, Edge, Safari)

**How it works:**

The `StorageAdapterDownload` holds all data in memory. Hypervideo data is passed via init options at startup (see [Inline on a Page](#inline-on-a-page) below). Viewing is always available. For editing, a login dialog prompts for a display name (guest mode — no account needed). The Save button is disabled (no persistent target); use **Save As** to export a JSON snapshot that can be reloaded later.

**Limitations:**
- No persistence — changes are lost on page reload unless exported via Save As
- No file uploads (media must be referenced by URL)
- No multi-user collaboration

### Save As / Export

In server and local modes, Save As is also available as a supplemental export tool — useful for archiving or migrating content between instances.

## Embedding FrameTrail

### In an iframe

```html
<iframe
    src="https://your-server.com/frametrail/#hypervideo=abc123"
    width="800"
    height="600"
    frameborder="0"
    allowfullscreen>
</iframe>
```

### Inline on a Page

Include all FrameTrail scripts/styles and initialize:

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

### With Inline Data

You can pass all hypervideo and resource data directly via init options, bypassing the `_data/` directory entirely. This works in all three storage modes and is the primary approach for in-memory mode (Option 3) — embed FrameTrail on any page without any backend or data folder.

```javascript
FrameTrail.init({
    target: '#container',
    startID: '0',
    config: { theme: 'dark' },
    contents: [{
        hypervideo: {
            meta: { name: 'My Video', creator: 'Anonymous', creatorId: 'anon',
                    created: Date.now(), lastchanged: Date.now() },
            config: { layoutArea: {}, hidden: false },
            clips: [{ resourceId: 'my-video', duration: 120, start: 0, end: 120 }],
            contents: [],
            subtitles: {},
            globalEvents: {},
            customCSS: ''
        },
        annotations: []
    }],
    resources: [{
        label: 'Inline resources',
        type: 'frametrail',
        data: {
            'my-video': { name: 'Main Video', type: 'youtube', src: 'dQw4w9WgXcQ' }
        }
    }]
}, 'PlayerLauncher');
```

**Note:** When no PHP server and no local folder are available, FrameTrail falls back to `storageMode: 'download'` — the `StorageAdapterDownload` holds data in memory. Inline data init options work fully in this mode: viewing and editing are both functional, and changes can be exported via the Save As dialog. Nothing persists past a page reload unless exported.

See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for the full initialization options reference.

## Building from Source

### Prerequisites

```bash
# Node.js 20+ required
npm install -g terser csso-cli
```

### Running the Build

```bash
# From the repository root
bash scripts/build.sh

# With a version label (embedded in the build README)
bash scripts/build.sh v2.0.0
```

### What the Build Script Does

1. **Concatenates CSS** — All CSS files from `src/` in load order → `build/frametrail.css`
2. **Inlines fonts** — Embeds woff2 font files as base64 data URIs in the CSS (4 fonts, ~170K base64 total)
3. **Concatenates JS** — All JS files from `src/` in load order → `build/frametrail.js`
4. **Minifies** — terser for JS, csso for CSS → `build/frametrail.min.js` + `build/frametrail.min.css`
5. **Generates HTML** — Clean entry points that load only the two bundles (instead of ~60 individual files)
6. **Copies static files** — `_server/`, `.htaccess`, `favico.png`, `LICENSE.md`

### Build Output

```
build/
├── index.html              # Player entry (loads bundles)
├── resources.html          # Resource manager entry
├── setup.html              # Setup wizard
├── frametrail.js           # All JS concatenated (~2MB)
├── frametrail.min.js       # Minified JS (~800KB)
├── frametrail.css          # All CSS concatenated (with inlined fonts)
├── frametrail.min.css      # Minified CSS
├── .htaccess               # Apache rules
├── favico.png
├── _server/                # PHP backend (copied as-is)
├── README.md               # Short installation guide
└── LICENSE.md
```

### Development vs Production

| | Development (`src/`) | Production (`build/`) |
|---|---|---|
| Files loaded | ~60 individual `<script>` and `<link>` tags | 2 bundles (`frametrail.min.js` + `.min.css`) |
| Edit workflow | Edit file → reload browser | Run build script → reload |
| Fonts | Loaded as separate woff2 files | Inlined as base64 in CSS |
| PHP backend | `src/_server/` | `build/_server/` (identical copy) |

For development, always work in `src/`. Only run the build when preparing a production deployment or testing the build output.

## CI/CD

### Build Verification

Every push to `main` or `develop` and every pull request triggers the build workflow (`.github/workflows/build.yml`):

1. Checks out the code on Ubuntu
2. Installs Node.js 20 + terser + csso-cli
3. Runs `scripts/build.sh`
4. Verifies all expected output files exist
5. Uploads the build as a downloadable artifact (7-day retention)

The artifact is downloadable from the **Actions** tab on GitHub — useful for quick testing without a full release.

### Creating a Release

Releases are fully automated via `.github/workflows/release.yml`. To create one:

```bash
# 1. Make sure main is up to date
git checkout main
git pull

# 2. Create and push a version tag
git tag v2.0.0
git push origin v2.0.0
```

GitHub Actions automatically:
1. Detects the `v2.0.0` tag
2. Runs `scripts/build.sh v2.0.0`
3. Zips the `build/` directory → `frametrail-v2.0.0.zip`
4. Creates a GitHub Release with the zip attached
5. Auto-generates release notes from merged PRs since the last tag

The release appears under **Releases** in the GitHub sidebar. Users download the zip, extract to their server, open in browser, done.

## Data Management

### Backing Up

Back up the entire `_data/` directory. It contains all user accounts, hypervideos, annotations, resources, and configuration. There is no database — it's all JSON files and uploaded media.

```bash
cp -r _data/ _data_backup_$(date +%Y%m%d)/
```

### Migrating Between Servers

Copy the `_data/` directory from one FrameTrail installation to another. Everything works immediately — user accounts, hypervideos, annotations, uploaded resources.

```bash
# On source server
tar czf frametrail-data.tar.gz _data/

# On target server
tar xzf frametrail-data.tar.gz
```

### Configuration

Server-side config is in `src/_server/config.php`:
- `$conf["dir"]["data"]` — Path to `_data` directory (default: `../_data`)

Runtime config is in `_data/config.json`:
- `defaultUserRole` — Role for new users (`"user"` or `"admin"`)
- `userNeedsConfirmation` — Require admin approval for new accounts
- `allowUploads` — Enable file uploads
- `allowCollaboration` — Allow multiple users to annotate
- `alwaysForceLogin` — Require login to view content
- `theme` — Default color theme

### File Permissions

The web server process (e.g., `www-data`) needs write access to:
- The installation directory (for creating `_data/` on first setup)
- `_data/` and all subdirectories (for saving data, uploading files)

```bash
chown -R www-data:www-data /path/to/frametrail/
chmod -R 775 /path/to/frametrail/_data/
```
