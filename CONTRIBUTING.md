# Contributing to FrameTrail

Thank you for your interest in contributing to FrameTrail! This guide will help you get started with development.

## Getting Started

### Prerequisites

- Apache Web Server (2.2.29+) with PHP (5.6.2+)
- A modern browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of JavaScript, jQuery, and CSS

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/OpenHypervideo/FrameTrail.git
   cd FrameTrail
   ```

2. Set up a local server:
   - **XAMPP/MAMP/WAMP**: Place the folder in your `htdocs` directory
   - **PHP built-in server**: `php -S localhost:8000` (limited functionality)
   - **Docker**: Any Apache+PHP image works

3. Open `http://localhost/FrameTrail` (or your configured path) in your browser

4. Complete the setup wizard to create an admin account

### Read-Only Mode (No Server)

You can browse existing hypervideos without a server by opening `index.html` directly in Firefox. Chrome blocks local AJAX requests by default. Editing features require a server.

## Project Structure

```
FrameTrail/
├── index.html              # Main player entry point
├── resources.html          # Standalone resource manager
├── setup.html              # Installation wizard
├── _data/                  # Runtime data (gitignored)
│   ├── config.json         # Instance configuration
│   ├── users.json          # User accounts
│   ├── resources/          # Uploaded media files
│   └── hypervideos/        # Hypervideo data
├── _lib/                   # Third-party libraries
├── _server/                # PHP backend
├── _shared/                # Shared code (modules, types, styles)
│   ├── frametrail-core/    # Core framework
│   ├── modules/            # Shared modules
│   ├── types/              # Resource type definitions
│   └── styles/             # Global CSS
├── player/                 # Player application
│   ├── modules/            # Player-specific modules
│   └── types/              # Player-specific types
└── resourcemanager/        # Standalone resource manager app
```

## Architecture Overview

FrameTrail uses a custom module system. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

**Key concepts:**
- **Modules** handle business logic and UI (`FrameTrail.defineModule`)
- **Types** define data structures like Resources, Overlays, Annotations (`FrameTrail.defineType`)
- **State** is managed centrally with reactive updates (`FrameTrail.changeState`)
- **Data** is stored as JSON files, no database required

## Making Changes

### Code Style

- Use tabs for indentation
- Use meaningful variable names
- Follow existing patterns in the codebase
- Add JSDoc-style comments for public methods:

```javascript
/**
 * I do something useful.
 *
 * @method myMethod
 * @param {String} param1 Description of param1
 * @return {Boolean} Description of return value
 */
function myMethod(param1) {
    // ...
}
```

### Creating a New Module

1. Create your module file in the appropriate location:
   - `_shared/modules/` for modules used by multiple apps
   - `player/modules/` for player-specific modules

2. Use the module template:

```javascript
FrameTrail.defineModule('MyModule', function(FrameTrail) {
    
    var labels = FrameTrail.module('Localization').labels;
    
    // Private variables
    var myVar = null;
    
    // Private functions
    function doSomething() {
        // ...
    }
    
    // State change listeners
    function onEditModeChange(newValue, oldValue) {
        // React to state changes
    }
    
    // Cleanup when module is unloaded
    function onUnload() {
        // Clean up event listeners, DOM elements, etc.
    }
    
    // Public interface
    return {
        doSomething: doSomething,
        
        onChange: {
            'editMode': onEditModeChange
        },
        
        onUnload: onUnload
    };
});
```

3. Initialize your module where needed (usually in a Launcher module)

### Creating a New Resource Type

See [docs/EXTENDING.md](docs/EXTENDING.md) for a complete guide.

### Localization

All user-facing strings should use the localization system:

```javascript
var labels = FrameTrail.module('Localization').labels;
var message = labels['MessageSomething'];
```

Add new strings to `_shared/modules/Localization/locale/en-US.js` and other locale files.

## Testing Your Changes

1. Test in multiple browsers (Chrome, Firefox at minimum)
2. Test both with and without edit mode
3. Test with different resource types
4. Check the browser console for errors
5. Test on a fresh FrameTrail instance (delete `_data/` folder to reset)

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with clear commit messages
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request with:
   - Clear description of what you changed and why
   - Screenshots/GIFs for UI changes
   - Steps to test your changes

## Reporting Issues

When reporting bugs, please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots (if relevant)

## Questions?

- Open an issue for questions about the codebase
- Check existing issues before creating new ones

## License

By contributing to FrameTrail, you agree that your contributions will be licensed under the project's dual MIT/GPL license.
