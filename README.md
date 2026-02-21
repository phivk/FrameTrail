# FrameTrail

## Open Hypervideo Environment

Create, annotate, and remix interactive videos on the web.

FrameTrail is an open-source platform for building non-linear, interactive video experiences. Add overlays, annotations, video links, and code snippets to any video — or create time-based presentations without video at all. All data is stored as portable JSON files with no database required.

FrameTrail works in three modes with different capabilities. A PHP backend provides the full feature set: multi-user accounts, collaborative editing, file uploads, and optional media processing. In Chrome/Edge, the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) enables single-user local editing with file uploads, but without transcoding or user management. In any browser — including Firefox and Safari — an in-memory mode lets you view and edit contents and export changes as JSON.

---

## Features

### Three Ways to Run

1. **Server mode** (Apache + PHP) — Multi-user accounts, collaborative editing, file uploads, optional media transcoding and thumbnail generation
2. **Local folder mode** (Chrome/Edge) — Single-user editing saved directly to a local `_data` folder via the File System Access API; file uploads supported, no transcoding or user management
3. **In-memory mode** (all browsers) — View and edit in-browser; export changes as JSON via Save As; no file uploads; requires content to be passed via init options. Works in Firefox, Safari, and everywhere else.

### Editing

- Use any **HTML5 video**, **YouTube**, **Vimeo**, or an empty **time container** as source
- Add time-based **overlays** positioned on the video
- Add **annotations** displayed alongside the video
- Insert **code snippets** (JavaScript) triggered at specific timestamps
- Create **video links** to other hypervideos (internal or external)
- Add and sync **subtitles** (VTT format)
- View, compare, and reuse annotations from other users

### Resource Types

FrameTrail supports a wide range of embeddable content:

| Category | Types |
|----------|-------|
| Media | Video (HTML5/HLS), Image, Audio, PDF |
| Video platforms | YouTube, Vimeo, Wistia, Loom, Twitch |
| Social/Web | X/Twitter, Bluesky, Mastodon, TikTok, Reddit, Flickr |
| Audio/Music | Soundcloud, Spotify |
| Presentations | Slideshare, Figma, Codepen |
| Content | Text (rich HTML), Wikipedia, Webpage (iframe), URL Preview |
| Interactive | Quiz, Hotspot, Location (OpenStreetMap), Entity (linked data) |

### Data & Portability

- All data stored as **JSON files** in a `_data` directory — no database
- Copy the entire `_data` folder to move your instance between servers
- Export/download data with the built-in **Save As** feature (works without server or File System Access API)
- Annotations follow the **W3C Web Annotation** data model

### Browser Support

- **Desktop:** Chrome, Firefox, Edge, Safari (latest versions)
- **Local folder mode:** Chrome/Edge only (requires File System Access API)
- **In-memory/download mode:** All browsers — Firefox and Safari get full view + edit + export
- **Mobile:** Player works in server mode; editing is disabled

---

## Installation

### Option 1: Server Deployment (PHP)

1. Download the [latest release](https://github.com/OpenHypervideo/FrameTrail/releases) or build from source
2. Extract to any directory
3. In that directory, run: `php -S localhost:8080`
4. Open `http://localhost:8080` and follow the setup wizard

**Requirements:** PHP 7.4+. The directory needs write permissions so FrameTrail can create `_data/`.

For public deployments, use Apache (`.htaccess` included) or nginx with PHP-FPM. No PHP installed? Use [XAMPP](https://www.apachefriends.org/) (Windows) or [MAMP](https://www.mamp.info/) (Mac/Windows).

### Option 2: Local Folder Mode (No Server)

1. Download and extract FrameTrail
2. Open `index.html` in Chrome or Edge
3. When prompted, select or create a `_data` folder on your computer
4. Full editing — all changes saved directly to your local files

---

## Getting Started

1. **Enter edit mode** — Click the Edit button (top right). In server mode, log in with your account or continue as a guest (name only). In local folder and in-memory modes, only the guest option is shown.
2. **Create a hypervideo** — In the titlebar, click "New Hypervideo" and choose a video source
3. **Add resources** — Click "Manage Resources" to upload or link media
4. **Edit** — Drag resources onto the video timeline as overlays or annotations
5. **Save** — In server/local mode, Ctrl+S saves directly. As a guest, use Save As to export your changes as JSON.
6. **Share** — Copy the URL or use iframe embedding

---

## Development

### Quick Start

```bash
git clone https://github.com/OpenHypervideo/FrameTrail.git
cd FrameTrail
```

Point your web server at the `src/` directory. Open in your browser, complete the setup wizard, and start editing. Changes to source files take effect on reload — no build step needed for development.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

### Building for Production

```bash
# Install build tools (one-time)
npm install -g terser csso-cli

# Build
bash scripts/build.sh
```

This creates a `build/` directory with concatenated and minified JS/CSS bundles. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

### Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — Development setup, code style, branching, CI/CD
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Module system, state management, storage modes, data model
- [docs/EXTENDING.md](docs/EXTENDING.md) — Adding resource types, modules, localization
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Server deployment, local usage, building, releasing

---

## Project Structure

```
FrameTrail/
├── src/                    # Source code (runnable as-is for development)
│   ├── index.html          # Player/editor entry point
│   ├── resources.html      # Resource manager
│   ├── setup.html          # Setup wizard
│   ├── _lib/               # Vendored third-party libraries
│   ├── _shared/            # Core framework, shared modules, types, styles
│   ├── player/             # Player-specific modules and types
│   ├── resourcemanager/    # Resource manager launcher
│   └── _server/            # PHP backend
├── scripts/
│   └── build.sh            # Production build script
├── .github/workflows/      # CI/CD (build verification + release packaging)
├── docs/                   # Developer documentation
├── CLAUDE.md               # AI assistant project guide
├── CONTRIBUTING.md         # Contributor guide
├── LICENSE.md              # MIT + GPL v3 dual license
└── README.md               # This file
```

---

## Contributors

Joscha Jäger, Michael J. Zeder, Michael Morgenstern, Olivier Aubert

---

## License

FrameTrail is dual licensed under [MIT](http://www.opensource.org/licenses/mit-license.php) and [GPL v3](http://www.gnu.org/licenses/gpl-3.0.html).

See [LICENSE.md](LICENSE.md) for details.
