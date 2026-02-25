#!/bin/bash
set -e

# ──────────────────────────────────────────────
#  Configuration
# ──────────────────────────────────────────────

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)/src"
BUILD_DIR="$(cd "$(dirname "$0")/.." && pwd)/build"
VERSION="${1:-dev}"

# ──────────────────────────────────────────────
#  Clean & prepare
# ──────────────────────────────────────────────

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "Building FrameTrail $VERSION ..."
echo "  Source:  $SRC_DIR"
echo "  Output:  $BUILD_DIR"

# ──────────────────────────────────────────────
#  CSS concatenation order
# ──────────────────────────────────────────────
#  Libraries first, then FrameTrail styles,
#  then types, then modules.
#  This mirrors the <link> order in index.html.

CSS_FILES=(
    # Library CSS
    "_lib/quill/quill.snow.css"
    "_lib/leaflet/leaflet.css"
    # FrameTrail base styles
    "_shared/styles/variables.css"
    "_shared/styles/frametrail-webfont.css"
    "_shared/styles/generic.css"
    "_lib/dialog/dialog.css"

    # Type styles (player types)
    "player/types/Annotation/style.css"
    "player/types/Hypervideo/style.css"
    "player/types/Overlay/style.css"

    # Type styles (shared resource types — base type first)
    "_shared/types/Resource/style.css"
    "_shared/types/ResourceImage/style.css"
    "_shared/types/ResourceLocation/style.css"
    "_shared/types/ResourcePDF/style.css"
    "_shared/types/ResourceAudio/style.css"
    "_shared/types/ResourceVideo/style.css"
    "_shared/types/ResourceVimeo/style.css"
    "_shared/types/ResourceWebpage/style.css"
    "_shared/types/ResourceWikipedia/style.css"
    "_shared/types/ResourceYoutube/style.css"
    "_shared/types/ResourceText/style.css"
    "_shared/types/ResourceQuiz/style.css"
    "_shared/types/ResourceHotspot/style.css"
    "_shared/types/ResourceEntity/style.css"
    "_shared/types/ResourceWistia/style.css"
    "_shared/types/ResourceSoundcloud/style.css"
    "_shared/types/ResourceTwitch/style.css"
    "_shared/types/ResourceBluesky/style.css"
    "_shared/types/ResourceCodepen/style.css"
    "_shared/types/ResourceFigma/style.css"
    "_shared/types/ResourceLoom/style.css"
    "_shared/types/ResourceUrlPreview/style.css"
    "_shared/types/ResourceXTwitter/style.css"
    "_shared/types/ResourceTiktok/style.css"
    "_shared/types/ResourceMastodon/style.css"
    "_shared/types/ResourceSpotify/style.css"
    "_shared/types/ResourceSlideshare/style.css"
    "_shared/types/ResourceReddit/style.css"
    "_shared/types/ResourceFlickr/style.css"

    # Type styles (remaining player types)
    "player/types/Subtitle/style.css"
    "player/types/CodeSnippet/style.css"
    "player/types/ContentView/style.css"

    # Module styles
    "_shared/modules/ResourceManager/style.css"
    "_shared/modules/UserManagement/style.css"
    "_shared/modules/ViewResources/style.css"
    "player/modules/Interface/style.css"
    "player/modules/InterfaceModal/style.css"
    "player/modules/Sidebar/style.css"
    "player/modules/Titlebar/style.css"
    "player/modules/ViewOverview/style.css"
    "player/modules/ViewVideo/style.css"
    "player/modules/ViewLayout/style.css"
    "player/modules/HypervideoSettingsDialog/style.css"
    "player/modules/AdminSettingsDialog/style.css"
    "resourcemanager/modules/ResourceManagerLauncher/style.css"
)

# ──────────────────────────────────────────────
#  JS concatenation order
# ──────────────────────────────────────────────
#  CRITICAL: Order matters! Libraries → core →
#  L10n → types → modules → launcher.
#  This mirrors the <script> order in index.html.

JS_FILES=(
    # Libraries (order from index.html <head>)
    "_lib/hlsjs/hls.min.js"
    "_lib/parsers/vtt.min.js"
    "_lib/interactjs/interact.min.js"
    "_lib/quill/quill.min.js"
    "_lib/leaflet/leaflet.js"
    "_lib/collisiondetection/collisiondetection.js"
    "_lib/codemirror6/cm6.bundle.js"
    "_lib/codemirror6/cm6linters.js"

    # FrameTrail Core (must come before any defineModule/defineType calls)
    "_shared/frametrail-core/frametrail-core.js"

    # Localization (bundled into JS — must come before modules that use labels)
    "_shared/modules/Localization/locale/en-US.js"
    "_shared/modules/Localization/locale/de.js"
    "_shared/modules/Localization/module.js"

    # Types (parent types before children — Resource before ResourceImage etc.)
    "player/types/Annotation/type.js"
    "player/types/Hypervideo/type.js"
    "player/types/Overlay/type.js"
    "_shared/types/Resource/type.js"
    "_shared/types/ResourceImage/type.js"
    "_shared/types/ResourceLocation/type.js"
    "_shared/types/ResourcePDF/type.js"
    "_shared/types/ResourceAudio/type.js"
    "_shared/types/ResourceVideo/type.js"
    "_shared/types/ResourceVimeo/type.js"
    "_shared/types/ResourceWebpage/type.js"
    "_shared/types/ResourceWikipedia/type.js"
    "_shared/types/ResourceYoutube/type.js"
    "_shared/types/ResourceText/type.js"
    "_shared/types/ResourceQuiz/type.js"
    "_shared/types/ResourceHotspot/type.js"
    "_shared/types/ResourceEntity/type.js"
    "_shared/types/ResourceWistia/type.js"
    "_shared/types/ResourceSoundcloud/type.js"
    "_shared/types/ResourceTwitch/type.js"
    "_shared/types/ResourceBluesky/type.js"
    "_shared/types/ResourceCodepen/type.js"
    "_shared/types/ResourceFigma/type.js"
    "_shared/types/ResourceLoom/type.js"
    "_shared/types/ResourceUrlPreview/type.js"
    "_shared/types/ResourceXTwitter/type.js"
    "_shared/types/ResourceTiktok/type.js"
    "_shared/types/ResourceMastodon/type.js"
    "_shared/types/ResourceSpotify/type.js"
    "_shared/types/ResourceSlideshare/type.js"
    "_shared/types/ResourceReddit/type.js"
    "_shared/types/ResourceFlickr/type.js"
    "player/types/Subtitle/type.js"
    "player/types/CodeSnippet/type.js"
    "player/types/ContentView/type.js"

    # Dialog and tabs helpers (must come before modules that use them)
    "_lib/dialog/dialog.js"
    "_lib/vanilla-tabs/vanilla-tabs.js"

    # Storage layer (must come before StorageManager and Database)
    "_shared/frametrail-core/storage/StorageAdapter.js"
    "_shared/frametrail-core/storage/StorageAdapterServer.js"
    "_shared/frametrail-core/storage/StorageAdapterLocal.js"
    "_shared/frametrail-core/storage/StorageAdapterDownload.js"
    "_shared/modules/StorageManager/module.js"

    # Shared modules
    "_shared/modules/Database/module.js"
    "_shared/modules/TagModel/module.js"
    "_shared/modules/ResourceManager/module.js"
    "_shared/modules/UserManagement/module.js"
    "_shared/modules/ViewResources/module.js"
    "_shared/modules/RouteNavigation/module.js"
    "_shared/modules/HypervideoPicker/module.js"
    "_shared/modules/HypervideoFormBuilder/module.js"
    "_shared/modules/UserTraces/module.js"
    "_shared/modules/UndoManager/module.js"

    # Player modules
    "player/modules/AnnotationsController/module.js"
    "player/modules/PlayerLauncher/module.js"
    "player/modules/HypervideoModel/module.js"
    "player/modules/HypervideoController/module.js"
    "player/modules/InteractionController/module.js"
    "player/modules/Interface/module.js"
    "player/modules/InterfaceModal/module.js"
    "player/modules/OverlaysController/module.js"
    "player/modules/Sidebar/module.js"
    "player/modules/SubtitlesController/module.js"
    "player/modules/Titlebar/module.js"
    "player/modules/CodeSnippetsController/module.js"
    "player/modules/TimelineController/module.js"
    "player/modules/ViewOverview/module.js"
    "player/modules/ViewVideo/module.js"
    "player/modules/ViewLayout/module.js"
    "player/modules/HypervideoSettingsDialog/module.js"
    "player/modules/AdminSettingsDialog/module.js"

    # Resource manager module
    "resourcemanager/modules/ResourceManagerLauncher/module.js"
)

# ──────────────────────────────────────────────
#  Concatenate
# ──────────────────────────────────────────────

echo "Concatenating CSS (${#CSS_FILES[@]} files)..."
> "$BUILD_DIR/frametrail.css"
for f in "${CSS_FILES[@]}"; do
    if [ -f "$SRC_DIR/$f" ]; then
        echo "/* === $f === */" >> "$BUILD_DIR/frametrail.css"
        cat "$SRC_DIR/$f" >> "$BUILD_DIR/frametrail.css"
        echo "" >> "$BUILD_DIR/frametrail.css"
    else
        echo "  WARNING: Missing CSS file: $f"
    fi
done

echo "Concatenating JS (${#JS_FILES[@]} files)..."
> "$BUILD_DIR/frametrail.js"
for f in "${JS_FILES[@]}"; do
    if [ -f "$SRC_DIR/$f" ]; then
        echo "/* === $f === */" >> "$BUILD_DIR/frametrail.js"
        cat "$SRC_DIR/$f" >> "$BUILD_DIR/frametrail.js"
        echo ";" >> "$BUILD_DIR/frametrail.js"
    else
        echo "  WARNING: Missing JS file: $f"
    fi
done

# ──────────────────────────────────────────────
#  Inline woff2 font files into CSS as base64
# ──────────────────────────────────────────────
#  The source CSS references fonts via relative url()
#  paths (../fonts/...). We inline only woff2 format
#  (universal modern browser support).
#
#  This must happen BEFORE minification so the
#  inlined data URIs end up in both frametrail.css
#  and frametrail.min.css.

echo "Inlining woff2 font files into CSS..."
FONTS_DIR="$SRC_DIR/_shared/fonts"

inline_font() {
    local css_file="$1"
    local url_path="$2"
    local font_file="$3"
    local b64=$(base64 -w0 "$font_file" 2>/dev/null || base64 -i "$font_file")
    # Escape the url path for use in sed
    local escaped_path=$(printf '%s\n' "$url_path" | sed 's/[.[\/*^$()+?{|]/\\&/g')
    sed -i.bak "s|url('${escaped_path}')|url('data:font/woff2;base64,${b64}')|g" "$css_file"
    sed -i.bak "s|url(\"${escaped_path}\")|url(\"data:font/woff2;base64,${b64}\")|g" "$css_file"
}

# FrameTrail icon webfont
inline_font "$BUILD_DIR/frametrail.css" \
    "../fonts/FrameTrail_Web/frametrail-webfont.woff2" \
    "$FONTS_DIR/FrameTrail_Web/frametrail-webfont.woff2"

# Titillium Web text font (3 weights)
inline_font "$BUILD_DIR/frametrail.css" \
    "../fonts/Titillium_Web/TitilliumWeb-Regular.woff2" \
    "$FONTS_DIR/Titillium_Web/TitilliumWeb-Regular.woff2"
inline_font "$BUILD_DIR/frametrail.css" \
    "../fonts/Titillium_Web/TitilliumWeb-Bold.woff2" \
    "$FONTS_DIR/Titillium_Web/TitilliumWeb-Bold.woff2"
inline_font "$BUILD_DIR/frametrail.css" \
    "../fonts/Titillium_Web/TitilliumWeb-Light.woff2" \
    "$FONTS_DIR/Titillium_Web/TitilliumWeb-Light.woff2"

rm -f "$BUILD_DIR/frametrail.css.bak"

# ──────────────────────────────────────────────
#  Minify
# ──────────────────────────────────────────────

echo "Minifying JS with terser..."
terser "$BUILD_DIR/frametrail.js" \
    --compress --mangle \
    --output "$BUILD_DIR/frametrail.min.js"

echo "Minifying CSS with csso..."
csso "$BUILD_DIR/frametrail.css" \
    --output "$BUILD_DIR/frametrail.min.css"

# ──────────────────────────────────────────────
#  Generate bundled HTML entry points
# ──────────────────────────────────────────────
#  Instead of parsing/rewriting the source HTML
#  (fragile), we generate clean minimal files that
#  load only the bundles. The init code is copied
#  from the source HTML and rarely changes.

cat > "$BUILD_DIR/index.html" << 'PLAYER_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="cache-control" content="no-cache">
    <title>FrameTrail</title>
    <link rel="shortcut icon" href="favico.png">
    <link rel="stylesheet" href="frametrail.min.css">
    <link rel="stylesheet" href="_data/custom.css">
    <script src="frametrail.min.js"></script>
    <script>
        $(document).ready(function() {
            if (!!document.location.host) {
                $.ajax({
                    type: "POST",
                    url: "_server/ajaxServer.php",
                    data: {"a": "setupCheck"},
                    dataType: "json",
                    success: function(ret) {
                        if (ret["code"] != "1") {
                            window.location.replace(
                                window.location.href.replace('index.html', '') + 'setup.html'
                            );
                        }
                    }
                });
            }
            window.myInstance = FrameTrail.init({
                target:         'body',
                contentTargets: {},
                contents:       null,
                startID:        null,
                resources:      [{ label: "Choose Resources",
                                   data: "_data/resources/_index.json",
                                   type: "frametrail" }],
                tagdefinitions: null,
                config:         null,
                language:       'en'
            });
        });
    </script>
</head>
<body></body>
</html>
PLAYER_HTML

cat > "$BUILD_DIR/resources.html" << 'RESOURCES_HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="cache-control" content="no-cache">
    <title>Resource Management</title>
    <link rel="shortcut icon" href="favico.png">
    <link rel="stylesheet" href="frametrail.min.css">
    <link rel="stylesheet" href="_data/custom.css">
    <script src="frametrail.min.js"></script>
    <script>
        $(document).ready(function() {
            if (!!document.location.host) {
                $.ajax({
                    type: "POST",
                    url: "_server/ajaxServer.php",
                    data: {"a": "setupCheck"},
                    dataType: "json",
                    success: function(ret) {
                        if (ret["code"] != "1") {
                            window.location.replace(
                                window.location.href.replace('resources.html', '') + 'setup.html'
                            );
                        }
                    }
                });
            }
            window.myInstance = FrameTrail.init({
                target:    'body',
                resources: [{ label: "Choose Resources",
                              data: "_data/resources/_index.json",
                              type: "frametrail" }],
                config:    null,
                language:  'en-US'
            }, 'ResourceManagerLauncher');
        });
    </script>
</head>
<body></body>
</html>
RESOURCES_HTML

# Copy setup.html from source, replacing dev CSS links with the minified bundle
awk '/<!-- BUILD:CSS -->/{print "    <link rel=\"stylesheet\" href=\"frametrail.min.css\">"; skip=1; next} /<!-- \/BUILD:CSS -->/{skip=0; next} !skip{print}' \
    "$SRC_DIR/setup.html" > "$BUILD_DIR/setup.html"

# ──────────────────────────────────────────────
#  Copy static files
# ──────────────────────────────────────────────

echo "Copying static files..."
cp "$SRC_DIR/favico.png" "$BUILD_DIR/"
cp "$SRC_DIR/.htaccess" "$BUILD_DIR/"
cp "$SRC_DIR/.user.ini" "$BUILD_DIR/"
cp -r "$SRC_DIR/_server" "$BUILD_DIR/_server"

# ──────────────────────────────────────────────
#  Add release README and LICENSE
# ──────────────────────────────────────────────

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$REPO_ROOT/LICENSE.md" "$BUILD_DIR/"

cat > "$BUILD_DIR/README.md" << 'README'
# FrameTrail __VERSION__

## Installation

1. Extract this archive into your web server directory (or any local directory)
2. Open a terminal in that directory and run: `php -S localhost:8080`
3. Open `http://localhost:8080` and follow the setup wizard

For public server deployment, use Apache (`.htaccess` included) or nginx with PHP 7.4+.

### Requirements

- PHP 7.4+
- The directory needs write permissions so FrameTrail can create `_data/`

### Documentation

For full documentation, examples, and source code visit:
https://github.com/OpenHypervideo/FrameTrail

### License

FrameTrail is dual licensed under MIT and GPL v3.
See LICENSE.md for details.
README
sed -i.bak "s/__VERSION__/${VERSION}/" "$BUILD_DIR/README.md"
rm -f "$BUILD_DIR/README.md.bak"

# ──────────────────────────────────────────────
#  Summary
# ──────────────────────────────────────────────

echo ""
echo "Build complete!"
echo ""
echo "  frametrail.js      $(wc -c < "$BUILD_DIR/frametrail.js" | tr -d ' ') bytes"
echo "  frametrail.min.js  $(wc -c < "$BUILD_DIR/frametrail.min.js" | tr -d ' ') bytes"
echo "  frametrail.css     $(wc -c < "$BUILD_DIR/frametrail.css" | tr -d ' ') bytes"
echo "  frametrail.min.css $(wc -c < "$BUILD_DIR/frametrail.min.css" | tr -d ' ') bytes"
