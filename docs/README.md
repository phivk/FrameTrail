# FrameTrail Developer Documentation

Welcome to the FrameTrail developer documentation. This documentation is for developers who want to understand, customize, or extend FrameTrail.

## Documentation Index

### Getting Started

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - How to set up your development environment, code style guidelines, and contribution workflow

### Technical Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Deep dive into FrameTrail's internal architecture
  - Module system and lifecycle
  - Type system and inheritance
  - State management
  - Data model and JSON structure
  - CSS theming system
  - Backend API

- **[INITIALIZATION.md](INITIALIZATION.md)** - Different ways to initialize and embed FrameTrail
  - Standard installation
  - Embedding in existing pages
  - Configuration options
  - Loading content from various sources
  - URL parameters
  - Multiple instances
  - Theming

- **[EXTENDING.md](EXTENDING.md)** - Guide to extending FrameTrail
  - Creating new resource types
  - Building custom modules
  - Adding localization
  - Custom events
  - Backend extensions
  - Theme creation
  - Undo/redo support

## Quick Links

### For Users
- [Getting Started Tutorial](https://frametrail.org/tutorials-gettingstarted.html)
- [Editing Hypervideos](https://frametrail.org/tutorials-editing.html)
- [FAQ](https://frametrail.org/faq.html)

### For Developers
- [GitHub Repository](https://github.com/OpenHypervideo/FrameTrail)
- [Issue Tracker](https://github.com/OpenHypervideo/FrameTrail/issues)

## Key Concepts

### What is FrameTrail?

FrameTrail is an open-source hypervideo platform that enables:
- **Overlays**: Media placed on top of video at specific times and positions
- **Annotations**: User-contributed content displayed alongside video
- **Code Snippets**: JavaScript executed at specific video timestamps
- **Video Links**: Navigation between video fragments

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FrameTrail Core                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Modules   │  │    Types    │  │   State Manager     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────┐
│    Player     │  │   Resource    │  │  ResourceManager  │
│  Application  │  │   Manager     │  │   (Standalone)    │
└───────────────┘  └───────────────┘  └───────────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │    PHP Backend        │
                │  (JSON file storage)  │
                └───────────────────────┘
```

### Data Flow

1. **Initialization**: `FrameTrail.init()` creates an instance
2. **Module Loading**: Launcher initializes required modules
3. **Data Loading**: Database module loads JSON from server
4. **UI Rendering**: Interface modules create DOM elements
5. **Playback**: Controller coordinates time-based content
6. **Editing**: Changes update state → modules react → data saves

### No Database Required

All data is stored as JSON files:
```
_data/
├── config.json           # Instance settings
├── users.json            # User accounts
├── resources/            # Media files + index
└── hypervideos/          # Hypervideo data
```

This means you can:
- Copy/paste entire instances between servers
- Version control your content with Git
- Edit data files directly if needed
- Run in read-only mode without PHP

## Getting Help

- **Questions**: Open an issue on GitHub
- **Bugs**: Include browser version, steps to reproduce, and console errors
- **Feature requests**: Describe the use case and proposed solution

## License

FrameTrail is dual-licensed under [MIT](https://opensource.org/licenses/MIT) and [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html).
