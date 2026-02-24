/**
 * cm6linters.js
 * Wraps JSHint, CSSLint, and HTMLHint into CodeMirror 6 linter extensions.
 *
 * Exposes: window.FrameTrailCM6Linters = { js, css, html }
 *
 * Must be loaded after:
 *   jshint.js    → window.JSHINT
 *   csslint.js   → window.CSSLint
 *   htmlhint.js  → window.HTMLHint
 *   cm6.bundle.js → window.FrameTrailCM6
 */

(function (global) {

    'use strict';

    var cm6 = global.FrameTrailCM6;
    if (!cm6) {
        console.error('cm6linters.js: FrameTrailCM6 not found. Load cm6.bundle.js first.');
        return;
    }

    // Convert 1-based line + column to a CM6 character offset.
    // Clamps to valid range so out-of-bounds reports don't throw.
    function toOffset(view, line1, col1) {
        var doc = view.state.doc;
        var safeLineNum = Math.max(1, Math.min(line1, doc.lines));
        var lineInfo = doc.line(safeLineNum);
        var safeCol  = Math.max(0, Math.min((col1 || 1) - 1, lineInfo.length));
        return lineInfo.from + safeCol;
    }

    // ── JavaScript (JSHint) ────────────────────────────────────────────────

    var js = cm6.linter(function (view) {
        if (!global.JSHINT) { return []; }
        var code = view.state.doc.toString();
        var diagnostics = [];
        try {
            global.JSHINT(code, { esnext: true, undef: false, eqeqeq: false });
            (global.JSHINT.errors || []).forEach(function (e) {
                if (!e) { return; }
                var from = toOffset(view, e.line, e.character);
                diagnostics.push({
                    from:     from,
                    to:       Math.min(from + 1, view.state.doc.length),
                    severity: 'error',
                    message:  e.reason || 'JSHint error'
                });
            });
        } catch (err) { /* swallow parse failures */ }
        return diagnostics;
    }, { delay: 750 });

    // ── CSS (CSSLint) ──────────────────────────────────────────────────────

    var css = cm6.linter(function (view) {
        if (!global.CSSLint) { return []; }
        var code = view.state.doc.toString();
        var diagnostics = [];
        try {
            var result = global.CSSLint.verify(code, {
                'box-model':         false,
                'adjoining-classes': false,
                'duplicate-properties': true
            });
            (result.messages || []).forEach(function (m) {
                if (!m.line) { return; }
                var from = toOffset(view, m.line, m.col);
                diagnostics.push({
                    from:     from,
                    to:       Math.min(from + 1, view.state.doc.length),
                    severity: m.type === 'warning' ? 'warning' : 'error',
                    message:  m.message || 'CSSLint error'
                });
            });
        } catch (err) { /* swallow */ }
        return diagnostics;
    }, { delay: 750 });

    // ── HTML (HTMLHint) ────────────────────────────────────────────────────

    var html = cm6.linter(function (view) {
        if (!global.HTMLHint) { return []; }
        var code = view.state.doc.toString();
        var diagnostics = [];
        try {
            var msgs = global.HTMLHint.verify(code, {
                'tag-pair':              true,
                'attr-lowercase':        true,
                'attr-value-double-quotes': true,
                'doctype-first':         false
            });
            (msgs || []).forEach(function (m) {
                if (!m.line) { return; }
                var from = toOffset(view, m.line, m.col);
                diagnostics.push({
                    from:     from,
                    to:       Math.min(from + 1, view.state.doc.length),
                    severity: m.type === 'warning' ? 'warning' : 'error',
                    message:  m.message || 'HTMLHint error'
                });
            });
        } catch (err) { /* swallow */ }
        return diagnostics;
    }, { delay: 750 });

    // ── Expose ─────────────────────────────────────────────────────────────

    global.FrameTrailCM6Linters = { js: js, css: css, html: html };

})(window);
