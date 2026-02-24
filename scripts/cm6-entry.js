/**
 * cm6-entry.js
 * esbuild entry point for the CodeMirror 6 IIFE bundle.
 * Run scripts/build-codemirror6.sh to produce src/_lib/codemirror6/cm6.bundle.js.
 * This file is not loaded by the app — it is only used at bundle-build time.
 */

import {
    EditorView,
    lineNumbers,
    drawSelection,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap
} from '@codemirror/view';
import { EditorState, Transaction } from '@codemirror/state';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { css } from '@codemirror/legacy-modes/mode/css';
import { xml } from '@codemirror/legacy-modes/mode/xml';
import { linter, lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';

window.FrameTrailCM6 = {
    EditorView,
    EditorState,
    Transaction,
    StreamLanguage,
    syntaxHighlighting,
    defaultHighlightStyle,
    legacyModes: { javascript, css, html: xml },
    linter,
    lintGutter,
    oneDark,
    lineNumbers,
    drawSelection,
    highlightActiveLine,
    highlightActiveLineGutter,
    history,
    defaultKeymap,
    historyKeymap,
    keymap
};
