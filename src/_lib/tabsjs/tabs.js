/**
 * FTTabs — pure vanilla-JS tab widget.
 * Drop-in replacement for the former jquery.tabs plugin.
 * Adds the same CSS classes so existing stylesheets continue to work.
 *
 * API:
 *   FTTabs(el, opts)                     — initialise
 *   FTTabs(el, 'option', 'active')       — get active index (returns Number)
 *   FTTabs(el, 'option', 'active', n)    — set active index
 *   FTTabs(el, 'refresh')                — no-op (layout is CSS-driven)
 *
 * opts:
 *   active      {Number}    initial active tab index (default 0)
 *   activate    {Function}  called on tab change; receives (event, ui)
 *                           ui = { newTab, newPanel, oldTab, oldPanel }
 *                           — all ui values are plain DOM elements
 *   create      {Function}  called after initialisation
 *   heightStyle {String}    accepted (ignored; handled by CSS)
 */

(function () {
    'use strict';

    var DATA_KEY = '_ftTabs';

    /* ── TabsInstance ─────────────────────────────────────────────────────── */

    function TabsInstance(el, opts) {
        this._el         = el;
        this._opts       = opts || {};
        this._active     = this._opts.active !== undefined
                               ? parseInt(this._opts.active, 10)
                               : 0;
        this._onActivate = this._opts.activate || null;
        this._panels     = [];
        this._lis        = [];
        this._init();
    }

    TabsInstance.prototype._init = function () {
        var self = this;
        var el   = this._el;

        el.classList.add('ui-tabs');

        /* Tab nav list: first direct <ul> child */
        var ul = el.querySelector(':scope > ul');
        if (!ul) { return; }
        ul.classList.add('ui-tabs-nav');

        var lis = Array.prototype.slice.call(ul.querySelectorAll(':scope > li'));
        lis.forEach(function (li) { li.classList.add('ui-tabs-tab'); });
        this._lis = lis;

        /* Collect panels and wire click handlers */
        var panels = [];
        lis.forEach(function (li, i) {
            var a    = li.querySelector('a');
            var href = a ? (a.getAttribute('href') || '') : '';

            /* Resolve panel: by href="#id" or fallback to i-th direct div */
            var panel;
            if (href.charAt(0) === '#') {
                panel = el.querySelector(href);
            }
            if (!panel) {
                var divs = el.querySelectorAll(':scope > div');
                panel = divs[i] || null;
            }
            if (panel) { panel.classList.add('ui-tabs-panel'); }
            panels.push(panel);

            if (a) {
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (i !== self._active) {
                        self._activateTab(i, true, e);
                    }
                });
            }
        });
        this._panels = panels;

        /* Set initial state without firing the activate callback */
        this._activateTab(this._active, false, null);

        /* Fire create callback */
        if (this._opts.create) {
            this._opts.create.call(el, null, {});
        }
    };

    TabsInstance.prototype._activateTab = function (index, fireCallback, originalEvent) {
        var prevIndex = this._active;
        this._active  = index;

        /* Update <li> classes */
        this._lis.forEach(function (li, i) {
            li.classList.toggle('ui-tabs-active', i === index);
            li.classList.toggle('ui-state-active', i === index);
        });

        /* Show / hide panels */
        this._panels.forEach(function (panel, i) {
            if (!panel) { return; }
            panel.style.display = (i === index) ? '' : 'none';
        });

        /* Fire activate callback */
        if (fireCallback && this._onActivate) {
            var uiData = {
                newTab:   this._lis[index]   || null,
                newPanel: this._panels[index] || null,
                oldTab:   this._lis[prevIndex]   || null,
                oldPanel: this._panels[prevIndex] || null
            };
            this._onActivate(originalEvent || {}, uiData);
        }
    };

    TabsInstance.prototype.option = function (name, value) {
        if (name === 'active') {
            if (value === undefined) {
                return this._active;
            }
            var idx = parseInt(value, 10);
            if (!isNaN(idx) && idx !== this._active) {
                this._activateTab(idx, true, null);
            }
        }
    };

    /* refresh() is a no-op: CSS handles layout */
    TabsInstance.prototype.refresh = function () {};

    /* ── Public function ──────────────────────────────────────────────────── */

    /**
     * FTTabs(el, opts)                  — initialise
     * FTTabs(el, 'option', 'active')    — get active index
     * FTTabs(el, 'option', 'active', n) — set active index
     * FTTabs(el, 'refresh')             — no-op
     */
    window.FTTabs = function FTTabs(el, optsOrMethod) {
        if (!el) { return; }

        if (typeof optsOrMethod === 'string') {
            var inst = el[DATA_KEY];
            if (!inst) { return; }

            if (optsOrMethod === 'option') {
                return inst.option.apply(inst, Array.prototype.slice.call(arguments, 2));
            } else if (optsOrMethod === 'refresh') {
                inst.refresh();
            }
            return;
        }

        /* Initialisation */
        if (!el[DATA_KEY]) {
            el[DATA_KEY] = new TabsInstance(el, optsOrMethod || {});
        }
        return el;
    };

}());
