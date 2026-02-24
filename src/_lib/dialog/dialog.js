/**
 * Lightweight wrapper around the native HTML <dialog> element.
 * Replaces jQuery UI's .dialog() widget.
 *
 * Usage:
 *   var ctrl = Dialog({
 *       title:    'Dialog Title',            // or derived from content.getAttribute('title')
 *       content:  domElementOrJQueryObject,  // required
 *       modal:    true,                      // default true
 *       width:    500,                       // px or 'auto' (default)
 *       height:   400,                       // px or 'auto' (default)
 *       buttons:  [                          // array or plain object
 *           { text: 'OK', click: function() { ctrl.close(); } }
 *       ],
 *       close:    function() { ... },        // 'this' = content element
 *       open:     function() { ... },        // 'this' = content element
 *       classes:  'custom-class',            // extra CSS class(es) on <dialog>
 *       resizable: false,                    // ignored (native <dialog> not resizable by default)
 *       autoOpen: true                       // default true
 *   });
 *
 *   ctrl.open()                    // Show the dialog
 *   ctrl.close()                   // Close (fires close callback)
 *   ctrl.destroy()                 // Close + remove from DOM
 *   ctrl.setButtons(newButtons)    // Replace button bar
 *   ctrl.getButtons()              // Get current buttons array/object
 *   ctrl.widget()                  // Returns jQuery-wrapped <dialog> element
 *   ctrl.isOpen()                  // Returns true when dialog is open
 *   ctrl.element                   // jQuery-wrapped content element
 */

window.Dialog = function(opts) {
    opts = opts || {};

    // Resolve content element (accept jQuery wrapper or plain DOM node)
    var contentEl = (opts.content && opts.content.jquery)
        ? opts.content[0]
        : (opts.content || document.createElement('div'));

    // Derive title: explicit option → content element's title attribute → empty
    var title = opts.title
        || (contentEl.getAttribute && contentEl.getAttribute('title'))
        || '';

    // Remove title attribute from content to avoid browser tooltip
    if (contentEl.getAttribute && contentEl.getAttribute('title')) {
        contentEl.removeAttribute('title');
    }

    var buttons        = opts.buttons || [];
    var closeCallback  = opts.close   || null;
    var openCallback   = opts.open    || null;
    var modal          = (opts.modal !== false);
    var width          = opts.width;
    var height         = opts.height;
    var extraClasses   = opts.classes || '';
    var position       = opts.position || null;
    var closeOnEscape  = (opts.closeOnEscape !== false);

    // ── Build native <dialog> ──────────────────────────────────────────────

    var dlg = document.createElement('dialog');
    dlg.className = 'ft-dialog' + (extraClasses ? ' ' + extraClasses : '');

    if (typeof width === 'number') {
        dlg.style.width = width + 'px';
    } else if (typeof width === 'string' && width !== 'auto') {
        dlg.style.width = width;
    }
    if (typeof height === 'number') {
        dlg.style.height = height + 'px';
    } else if (typeof height === 'string' && height !== 'auto') {
        dlg.style.height = height;
    }

    // Title bar
    var titlebar = document.createElement('div');
    titlebar.className = 'ft-dialog-titlebar';

    var titleEl = document.createElement('span');
    titleEl.className = 'ft-dialog-title';
    titleEl.textContent = title;

    var xBtn = document.createElement('button');
    xBtn.type = 'button';
    xBtn.className = 'ft-dialog-titlebar-close';
    xBtn.setAttribute('aria-label', 'Close');
    xBtn.innerHTML = '<span class="icon-cancel"></span>';
    xBtn.addEventListener('click', function() { ctrl.close(); });
    if (!closeOnEscape) { xBtn.style.display = 'none'; }

    titlebar.appendChild(titleEl);
    titlebar.appendChild(xBtn);

    // Content wrapper
    var contentWrapper = document.createElement('div');
    contentWrapper.className = 'ft-dialog-content';
    contentWrapper.appendChild(contentEl);

    // Button pane
    var buttonPane = document.createElement('div');
    buttonPane.className = 'ft-dialog-buttonpane';

    dlg.appendChild(titlebar);
    dlg.appendChild(contentWrapper);
    dlg.appendChild(buttonPane);

    document.body.appendChild(dlg);

    // ── Button rendering ───────────────────────────────────────────────────

    function renderButtons(btns) {
        buttonPane.innerHTML = '';
        if (!btns) return;

        if (Array.isArray(btns)) {
            btns.forEach(function(btn) {
                var b = document.createElement('button');
                b.type    = 'button';
                b.textContent = btn.text || '';
                if (btn.id)       b.id = btn.id;
                if (btn.class)    b.className = btn.class;
                if (btn.disabled) b.disabled = true;
                b.addEventListener('click', function(e) {
                    if (btn.click) btn.click.call(contentEl, e);
                });
                buttonPane.appendChild(b);
            });
        } else {
            // Object format: { "Label": fn, "Cancel": fn }
            Object.keys(btns).forEach(function(label) {
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = label;
                b.addEventListener('click', function(e) {
                    btns[label].call(contentEl, e);
                });
                buttonPane.appendChild(b);
            });
        }
    }

    renderButtons(buttons);

    // ── Event wiring ──────────────────────────────────────────────────────

    // Escape key → close (native <dialog> fires 'cancel')
    dlg.addEventListener('cancel', function(e) {
        e.preventDefault();
        if (closeOnEscape) { ctrl.close(); }
    });

    // Backdrop click on modal → close
    if (modal) {
        dlg.addEventListener('click', function(e) {
            if (e.target === dlg) { ctrl.close(); }
        });
    }

    // ── Position helper ────────────────────────────────────────────────────

    function applyPosition(pos) {
        if (!pos || !pos.of) return;
        var ofEl = (pos.of && pos.of.jquery) ? pos.of[0] : pos.of;
        if (!ofEl) return;
        var rect = (ofEl === window)
            ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
            : ofEl.getBoundingClientRect();
        var dw = dlg.offsetWidth, dh = dlg.offsetHeight;
        // Only 'center center' is used in FrameTrail; implement enough to satisfy that.
        var atX = rect.left + rect.width / 2;
        var atY = rect.top  + rect.height / 2;
        dlg.style.position = 'fixed';
        dlg.style.margin   = '0';
        dlg.style.left = (atX - dw / 2) + 'px';
        dlg.style.top  = (atY - dh / 2) + 'px';
    }

    // ── Public controller ──────────────────────────────────────────────────

    var ctrl = {

        open: function() {
            if (modal) {
                dlg.showModal();
            } else {
                dlg.show();
            }
            if (position) {
                // Defer so layout is settled
                window.setTimeout(function() { applyPosition(position); }, 0);
            }
            if (openCallback) openCallback.call(contentEl);
            return ctrl;
        },

        close: function() {
            if (!dlg.open) return ctrl;
            dlg.close();
            if (closeCallback) closeCallback.call(contentEl);
            return ctrl;
        },

        destroy: function() {
            if (dlg.open) dlg.close();
            dlg.remove();
            return ctrl;
        },

        /** Replace the button bar contents. */
        setButtons: function(newButtons) {
            buttons = newButtons;
            renderButtons(newButtons);
            return ctrl;
        },

        /** Get current buttons (same reference as last setButtons/constructor). */
        getButtons: function() {
            return buttons;
        },

        /** Returns jQuery-wrapped <dialog> — equivalent to .dialog('widget'). */
        widget: function() {
            return $(dlg);
        },

        /** True when the dialog is currently open. */
        isOpen: function() {
            return dlg.open;
        },

        /** jQuery-wrapped content element — equivalent to the original $el. */
        element: $(contentEl)
    };

    // Auto-open by default, matching jQuery UI behaviour
    if (opts.autoOpen !== false) {
        ctrl.open();
    }

    return ctrl;
};
