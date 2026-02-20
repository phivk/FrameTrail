# Extending FrameTrail

This guide explains how to extend FrameTrail with new resource types, modules, and features.

## Adding a New Resource Type

Resource types define how different media (images, videos, maps, etc.) are displayed and edited. To add a new type:

### 1. Create the Type Definition

Create `_shared/types/ResourceMyType/type.js`:

```javascript
/**
 * @module Shared
 */

/**
 * I am the type definition of ResourceMyType.
 *
 * @class ResourceMyType
 * @category TypeDefinition
 * @extends Resource
 */

FrameTrail.defineType(
    'ResourceMyType',
    
    function(FrameTrail) {
        return {
            // Inherit from base Resource type
            parent: 'Resource',
            
            constructor: function(resourceData) {
                // Store the resource data
                this.resourceData = resourceData;
            },
            
            prototype: {
                
                /**
                 * Render the resource content for display
                 * @method renderContent
                 * @return {HTMLElement}
                 */
                renderContent: function() {
                    var self = this;
                    
                    // Create your content element
                    var element = $('<div class="resourceDetail" data-type="mytype">'
                        + '    <div class="myTypeContent">'
                        + '        <!-- Your content here -->'
                        + '    </div>'
                        + '</div>');
                    
                    // Initialize any plugins, load data, etc.
                    this.initializeContent(element);
                    
                    return element;
                },
                
                /**
                 * Render a thumbnail for the resource manager
                 * @method renderThumb
                 * @param {String} id - Optional resource ID
                 * @return {HTMLElement}
                 */
                renderThumb: function(id) {
                    var self = this;
                    var trueID = id || FrameTrail.module('Database').getIdOfResource(this.resourceData);
                    
                    var thumbBackground = this.resourceData.thumb 
                        ? 'background-image: url(' + FrameTrail.module('RouteNavigation').getResourceURL(this.resourceData.thumb) + ');'
                        : '';
                    
                    var tagList = (this.resourceData.tags ? this.resourceData.tags.join(' ') : '');
                    
                    var thumbElement = $('<div class="resourceThumb ' + tagList + '" '
                        + 'data-license-type="' + this.resourceData.licenseType + '" '
                        + 'data-resourceID="' + trueID + '" '
                        + 'data-type="' + this.resourceData.type + '" '
                        + 'style="' + thumbBackground + '">'
                        + '    <div class="resourceOverlay">'
                        + '        <div class="resourceIcon"><span class="icon-mytype"></span></div>'
                        + '    </div>'
                        + '    <div class="resourceTitle">' + this.resourceData.name + '</div>'
                        + '</div>');
                    
                    // Add preview button
                    var previewButton = $('<div class="resourcePreviewButton"><span class="icon-eye"></span></div>');
                    previewButton.click(function(evt) {
                        self.openPreview($(this).parent());
                        evt.stopPropagation();
                        evt.preventDefault();
                    });
                    thumbElement.append(previewButton);
                    
                    return thumbElement;
                },
                
                /**
                 * Render property controls for overlay editing
                 * @method renderPropertiesControls
                 * @param {Overlay} overlay
                 * @return {Object} { controlsContainer, changeStart, changeEnd, changeDimensions }
                 */
                renderPropertiesControls: function(overlay) {
                    // Use basic controls from parent, or extend with custom controls
                    var basicControls = this.renderBasicPropertiesControls(overlay);
                    
                    // Add custom controls if needed
                    var customControl = $('<div class="customControl">'
                        + '    <label>Custom Setting</label>'
                        + '    <input type="text" value="' + (overlay.data.attributes.customSetting || '') + '">'
                        + '</div>');
                    
                    customControl.find('input').on('change', function() {
                        overlay.data.attributes.customSetting = $(this).val();
                        FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
                    });
                    
                    basicControls.controlsContainer.find('#OverlayOptions').append(customControl);
                    
                    return basicControls;
                },
                
                /**
                 * Render time controls for annotation editing
                 * @method renderTimeControls
                 * @param {Annotation} annotation
                 * @return {Object} { controlsContainer, changeStart, changeEnd }
                 */
                renderTimeControls: function(annotation) {
                    return this.renderBasicTimeControls(annotation);
                },
                
                // Custom methods for your type
                initializeContent: function(element) {
                    // Load external scripts, init plugins, etc.
                }
            }
        };
    }
);
```

### 2. Create the Stylesheet

Create `_shared/types/ResourceMyType/style.css`:

```css
/* Resource detail (when displayed in player) */
.resourceDetail[data-type="mytype"] {
    width: 100%;
    height: 100%;
}

.resourceDetail[data-type="mytype"] .myTypeContent {
    /* Your styles */
}

/* Thumbnail in resource manager */
.resourceThumb[data-type="mytype"] .resourceOverlay {
    background: rgba(0, 0, 0, 0.3);
}

/* Annotation tile */
.tileElement[data-type="mytype"] [class^="icon-"]::before {
    content: '\e800';  /* Your icon code */
}

/* Edit properties panel icon */
.editPropertiesContainer .propertiesTypeIcon[data-type="mytype"] [class^="icon-"]::before {
    content: '\e800';
}
```

### 3. Add Icon (Optional)

If you need a custom icon, add it to `_shared/styles/frametrail-webfont.css` or use an existing icon class.

### 4. Register in HTML Files

Add the CSS and JS files to `index.html` and `resources.html`:

```html
<!-- In the CSS section -->
<link rel="stylesheet" type="text/css" href="_shared/types/ResourceMyType/style.css">

<!-- In the JS section -->
<script type="text/javascript" src="_shared/types/ResourceMyType/type.js"></script>
```

### 5. Add to Resource Manager (Optional)

If your resource type should be creatable via the Resource Manager, update `_shared/modules/ResourceManager/module.js` to include your type in the add resource dialog.

### 6. Update Backend (For Uploads)

If your resource type involves file uploads, update `_server/files.php` to handle the new file type.

## Creating a Custom Module

### Module Structure

```javascript
/**
 * @module Player
 */

/**
 * I am MyCustomModule.
 *
 * @class MyCustomModule
 * @static
 */

FrameTrail.defineModule('MyCustomModule', function(FrameTrail) {
    
    // Get localized strings
    var labels = FrameTrail.module('Localization').labels;
    
    // Private variables
    var domElement = null;
    var isActive = false;
    
    // Private methods
    function create() {
        domElement = $('<div class="myCustomModule"></div>');
        // Build UI...
    }
    
    function destroy() {
        if (domElement) {
            domElement.remove();
            domElement = null;
        }
    }
    
    function activate() {
        isActive = true;
        domElement.addClass('active');
    }
    
    function deactivate() {
        isActive = false;
        domElement.removeClass('active');
    }
    
    // State change handlers
    function onEditModeChange(newValue, oldValue) {
        if (newValue) {
            activate();
        } else {
            deactivate();
        }
    }
    
    function onViewModeChange(newValue, oldValue) {
        if (newValue === 'video') {
            domElement.show();
        } else {
            domElement.hide();
        }
    }
    
    // Cleanup
    function onUnload() {
        destroy();
    }
    
    // Initialize on module load
    create();
    
    // Public interface
    return {
        // Exposed methods
        activate: activate,
        deactivate: deactivate,
        
        // Exposed properties
        get element() { return domElement; },
        get isActive() { return isActive; },
        
        // State change listeners
        onChange: {
            'editMode': onEditModeChange,
            'viewMode': onViewModeChange
        },
        
        // Cleanup handler
        onUnload: onUnload
    };
});
```

### Integrating Your Module

1. **Add to a Launcher**: Initialize in `PlayerLauncher` or another launcher module:

```javascript
// In PlayerLauncher
FrameTrail.initModule('MyCustomModule');
```

2. **Add to Interface** (if it has UI): Initialize in the `Interface` module:

```javascript
// In Interface module
FrameTrail.initModule('MyCustomModule');
FrameTrail.module('MyCustomModule').element.appendTo(mainContainer);
```

3. **Use from other modules**:

```javascript
// In any other module
var myModule = FrameTrail.module('MyCustomModule');
myModule.activate();
```

## Adding Localization Strings

### 1. Add to English Locale

Edit `_shared/modules/Localization/locale/en-US.js`:

```javascript
window.FrameTrail_L10n['en-US'] = {
    // ... existing strings ...
    
    "MyModuleTitle": "My Module",
    "MyModuleDescription": "Description of my module",
    "MyModuleButtonLabel": "Click Me"
};
```

### 2. Add to Other Locales

Edit `_shared/modules/Localization/locale/de.js` (and others):

```javascript
window.FrameTrail_L10n['de'] = {
    // ... existing strings ...
    
    "MyModuleTitle": "Mein Modul",
    "MyModuleDescription": "Beschreibung meines Moduls",
    "MyModuleButtonLabel": "Klick Mich"
};
```

### 3. Use in Code

```javascript
var labels = FrameTrail.module('Localization').labels;
var title = labels['MyModuleTitle'];
```

## Adding Custom Events

### Define Event Handlers in Hypervideos

Users can add JavaScript that runs at specific times:

```javascript
// In hypervideo.json globalEvents
{
    "globalEvents": {
        "onReady": "console.log('Hypervideo ready');",
        "onPlay": "console.log('Playing');",
        "onPause": "console.log('Paused');",
        "onEnded": "console.log('Ended');"
    }
}
```

### Fire Custom Events from Modules

```javascript
// Fire event
FrameTrail.triggerEvent('myCustomEvent', {
    timestamp: Date.now(),
    data: 'some value'
});

// Listen in another module
FrameTrail.addEventListener('myCustomEvent', function(event) {
    console.log('Received:', event.detail);
});
```

## Extending the Backend

### Adding a New API Action

Edit `_server/ajaxServer.php`:

```php
case "myCustomAction":
    require_once("myCustomModule.php");
    $return = myCustomFunction($_POST["param1"], $_POST["param2"]);
    break;
```

Create `_server/myCustomModule.php`:

```php
<?php

require_once("./config.php");
require_once("./user.php");

function myCustomFunction($param1, $param2) {
    global $conf;
    
    // Check authentication if needed
    $login = userCheckLogin("user");
    if ($login["code"] != 1) {
        return array(
            "status" => "fail",
            "code" => 1,
            "string" => "Not logged in"
        );
    }
    
    // Do your thing...
    
    return array(
        "status" => "success",
        "code" => 0,
        "response" => $result
    );
}
```

### Call from JavaScript

```javascript
$.ajax({
    type: 'POST',
    url: '_server/ajaxServer.php',
    data: {
        a: 'myCustomAction',
        param1: 'value1',
        param2: 'value2'
    }
}).done(function(response) {
    if (response.status === 'success') {
        console.log(response.response);
    } else {
        console.error(response.string);
    }
});
```

## Adding a Custom Theme

### 1. Define Theme Variables

Edit `_shared/styles/variables.css`:

```css
.frametrail-body[data-frametrail-theme="mytheme"] .mainContainer,
.frametrail-body[data-frametrail-theme="mytheme"] .loadingScreen,
.frametrail-body[data-frametrail-theme="mytheme"] .userLoginOverlay,
.frametrail-body[data-frametrail-theme="mytheme"] .titlebar:not(.editActive),
.themeItem[data-theme="mytheme"],
.frametrail-body[data-frametrail-theme="mytheme"] .layoutManager {
    --primary-bg-color: #your-color;
    --secondary-bg-color: rgba(r, g, b, 0.6);
    --semi-transparent-bg-color: rgba(r, g, b, 0.8);
    --primary-fg-color: #your-text-color;
    --secondary-fg-color: #your-secondary-text;
    --semi-transparent-fg-color: rgba(r, g, b, 0.3);
    --semi-transparent-fg-highlight-color: rgba(r, g, b, 0.4);
    --semi-transparent-fg-active-color: var(--secondary-fg-color);
    --annotation-preview-bg-color: rgba(r, g, b, 0.2);
    --highlight-color: #your-highlight;
    --tooltip-bg-color: #your-tooltip;
    --video-background-color: #000;
}
```

### 2. Add Theme Selector

The theme selector in `HypervideoSettingsDialog` automatically picks up themes defined in CSS. Just ensure your theme follows the naming pattern.

## Undo/Redo Support

When making changes that should be undoable:

```javascript
// Register an undoable action
FrameTrail.module('UndoManager').register({
    category: 'overlays',  // or 'annotations'
    description: 'Change overlay position',
    
    undo: function() {
        // Restore previous state
        overlay.data.position = previousPosition;
        overlay.updatePosition();
    },
    
    redo: function() {
        // Re-apply the change
        overlay.data.position = newPosition;
        overlay.updatePosition();
    }
});

// Mark changes as unsaved
FrameTrail.module('HypervideoModel').newUnsavedChange('overlays');
```

## Testing Your Extensions

1. **Clear cache**: Delete browser cache or use incognito mode
2. **Reset data**: Delete `_data/` folder for fresh start
3. **Console debugging**:
   ```javascript
   // Access your module
   FrameTrail.instances[0].module('MyCustomModule')
   
   // Check state
   FrameTrail.instances[0].getState()
   ```
4. **Test in multiple browsers**: At minimum Chrome and Firefox
5. **Test edit mode**: Ensure your extension works in both view and edit modes

## Best Practices

1. **Follow existing patterns**: Look at similar modules/types for guidance
2. **Use localization**: Never hardcode user-facing strings
3. **Handle errors gracefully**: Always provide feedback for failures
4. **Clean up on unload**: Remove event listeners, DOM elements
5. **Use CSS custom properties**: For theme compatibility
6. **Document your code**: Use JSDoc-style comments
7. **Test edge cases**: Empty data, missing resources, network errors
