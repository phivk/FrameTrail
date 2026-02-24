#!/bin/bash
# Build the CodeMirror 6 vendored IIFE bundle for FrameTrail.
# Run this script once to produce src/_lib/codemirror6/cm6.bundle.js,
# then commit the result. Re-run whenever CM6 packages need updating.
#
# package.json and package-lock.json live in the scripts/ directory.
# node_modules is installed there and is gitignored.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/src/_lib/codemirror6"
ENTRY="$SCRIPT_DIR/cm6-entry.js"

mkdir -p "$OUT_DIR"

echo "Installing CM6 build dependencies..."
npm install --prefix "$SCRIPT_DIR" --silent

echo "Bundling CodeMirror 6..."
"$SCRIPT_DIR/node_modules/.bin/esbuild" "$ENTRY" \
    --bundle \
    --format=iife \
    --global-name=__cm6_unused__ \
    --outfile="$OUT_DIR/cm6.bundle.js" \
    --minify \
    --target=es2018

echo ""
echo "Done: $OUT_DIR/cm6.bundle.js ($(wc -c < "$OUT_DIR/cm6.bundle.js" | tr -d ' ') bytes)"
echo "Commit this file to git as a vendored library."
