/**
 * Lightweight drop-in replacement for jQuery UI's .tabs() widget.
 * No jQuery UI dependency.  Adds the same CSS classes (ui-tabs, ui-tabs-nav,
 * ui-tabs-tab, ui-tabs-active, ui-state-active, ui-tabs-panel) so existing
 * stylesheets continue to work without changes.
 *
 * Supported API:
 *   $(el).tabs(opts)                       – initialise
 *   $(el).tabs('option', 'active')         – get active index
 *   $(el).tabs('option', 'active', n)      – set active index
 *   $(el).tabs('refresh')                  – no-op (layout is CSS-driven)
 *
 * opts supported:
 *   active      {Number}    initial active tab index (default 0)
 *   activate    {Function}  called on tab change; receives (event, ui)
 *                           ui = { newTab, newPanel, oldTab, oldPanel }
 *   create      {Function}  called after initialisation
 *   heightStyle {String}    accepted (ignored; handled by CSS)
 */

(function ($) {
    'use strict';

    var DATA_KEY = '_ft_tabs';

    /* ── TabsInstance ─────────────────────────────────────────────────────── */

    function TabsInstance($el, opts) {
        this.$el      = $el;
        this._opts    = opts || {};
        this._active  = this._opts.active !== undefined
                            ? parseInt(this._opts.active, 10)
                            : 0;
        this._onActivate = this._opts.activate || null;
        this._panels     = [];
        this._$lis       = $();
        this._init();
    }

    TabsInstance.prototype._init = function () {
        var self = this;
        var $el  = this.$el;

        $el.addClass('ui-tabs');

        /* Tab nav list: first direct <ul> child */
        var $ul = $el.children('ul').first();
        $ul.addClass('ui-tabs-nav');

        var $lis = $ul.children('li');
        $lis.addClass('ui-tabs-tab');
        this._$lis = $lis;

        /* Collect panels and wire click handlers */
        var panels = [];
        $lis.each(function (i) {
            var $li  = $(this);
            var $a   = $li.children('a').first();
            var href = $a.attr('href') || '';

            /* Resolve panel: by href="#id" or fallback to i-th direct div */
            var $panel;
            if (href.charAt(0) === '#') {
                $panel = $el.find(href).first();
            } else {
                $panel = $el.children('div').eq(i);
            }
            $panel.addClass('ui-tabs-panel');
            panels.push($panel);

            $a.on('click.ft-tabs', function (e) {
                e.preventDefault();
                if (i !== self._active) {
                    self._activateTab(i, true, e);
                }
            });
        });
        this._panels = panels;

        /* Set initial state without firing the activate callback */
        this._activateTab(this._active, false, null);

        /* Fire create callback */
        if (this._opts.create) {
            this._opts.create.call(this.$el[0], null, {});
        }
    };

    TabsInstance.prototype._activateTab = function (index, fireCallback, originalEvent) {
        var prevIndex = this._active;
        this._active  = index;

        /* Update <li> classes */
        this._$lis.each(function (i) {
            $(this).toggleClass('ui-tabs-active ui-state-active', i === index);
        });

        /* Show / hide panels */
        for (var i = 0; i < this._panels.length; i++) {
            if (i === index) {
                this._panels[i].show();
            } else {
                this._panels[i].hide();
            }
        }

        /* Fire activate callback */
        if (fireCallback && this._onActivate) {
            var uiData = {
                newTab:   this._$lis.eq(index),
                newPanel: this._panels[index] || $(),
                oldTab:   this._$lis.eq(prevIndex),
                oldPanel: this._panels[prevIndex] || $()
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

    /* ── jQuery plugin ────────────────────────────────────────────────────── */

    $.fn.tabs = function (optOrMethod) {
        var args   = Array.prototype.slice.call(arguments, 1);
        var result;

        if (typeof optOrMethod === 'string') {
            var method = optOrMethod;

            this.each(function () {
                var inst = $.data(this, DATA_KEY);
                if (!inst) { return; }

                if (method === 'option') {
                    var r = inst.option.apply(inst, args);
                    if (r !== undefined) { result = r; }
                } else if (method === 'refresh') {
                    inst.refresh();
                }
            });

            return result !== undefined ? result : this;

        } else {
            /* Initialisation */
            return this.each(function () {
                if (!$.data(this, DATA_KEY)) {
                    var inst = new TabsInstance($(this), optOrMethod || {});
                    $.data(this, DATA_KEY, inst);
                }
            });
        }
    };

}(jQuery));


/**
 * Lightweight drop-in replacement for jQuery UI's .spinner() widget.
 * No jQuery UI dependency.
 *
 * Converts a plain <input> to <input type="number"> and wires events to match
 * the jQuery UI spinner callback API.
 *
 * Supported API:
 *   $(el).spinner(opts)               – initialise
 *   $(el).spinner('value', newValue)  – set value without triggering callbacks
 *
 * opts supported:
 *   step         {Number}    step increment (default 1)
 *   min          {Number}    minimum value
 *   max          {Number}    maximum value
 *   numberFormat {String}    accepted (ignored)
 *   icons        {Object}    accepted (ignored)
 *   create       {Function}  called immediately; receives (fakeEvt, ui)
 *                            fakeEvt.target = the input element
 *   spin         {Function}  called on real-time value change (input event)
 *                            receives (evt, { value: Number })
 *   change       {Function}  called on committed value change (change event)
 *                            receives (evt, {})
 */
(function ($) {
    'use strict';

    var DATA_KEY = '_ft_spinner';

    $.fn.spinner = function (optOrMethod) {
        var args = Array.prototype.slice.call(arguments, 1);

        if (typeof optOrMethod === 'string') {
            /* Method call */
            var method = optOrMethod;

            this.each(function () {
                if (method === 'value' && args[0] !== undefined) {
                    this.value = args[0];
                }
            });

            return this;

        } else {
            /* Initialisation */
            var opts = optOrMethod || {};

            return this.each(function () {
                var el = this;

                if ($.data(el, DATA_KEY)) { return; }
                $.data(el, DATA_KEY, true);

                /* Convert to a number input */
                el.type = 'number';
                el.classList.add('ft-spinner');
                if (opts.step !== undefined) { el.step = opts.step; }
                if (opts.min  !== undefined) { el.min  = opts.min;  }
                if (opts.max  !== undefined) { el.max  = opts.max;  }

                /* Fire create callback synchronously */
                if (opts.create) {
                    opts.create.call(el, { target: el }, {});
                }

                /* spin → fires on every input event (button clicks + keystrokes) */
                if (opts.spin) {
                    $(el).on('input._ft_spinner', function (evt) {
                        var value = parseFloat(el.value);
                        if (!isNaN(value)) {
                            opts.spin.call(el, evt, { value: value });
                        }
                    });
                }

                /* change → fires when the value is committed (blur / Enter) */
                if (opts.change) {
                    $(el).on('change._ft_spinner', function (evt) {
                        opts.change.call(el, evt, {});
                    });
                }
            });
        }
    };

}(jQuery));


/**
 * Lightweight drop-in replacement for jQuery UI's .accordion() widget.
 * No jQuery UI dependency.
 *
 * Supported options:
 *   collapsible {Boolean}  allow active panel to be collapsed (default true)
 *   active      {Number|false}  initially active panel index; false = all closed (default false)
 *   heightStyle {String}  accepted (ignored; panels use natural height)
 */
(function ($) {
    'use strict';

    $.fn.accordion = function (opts) {
        opts = opts || {};
        var collapsible = (opts.collapsible !== false);
        var active      = (opts.active !== undefined) ? opts.active : 0;

        return this.each(function () {
            var $el = $(this);
            $el.addClass('ui-accordion');

            var $headers = $el.children('h3');

            $headers.each(function (i) {
                var $h     = $(this);
                var $panel = $h.next('div');

                $h.addClass('ui-accordion-header');
                $panel.addClass('ui-accordion-content');

                /* Initial state */
                if (active === i) {
                    $h.addClass('ui-state-active');
                    $panel.show();
                } else {
                    $h.removeClass('ui-state-active');
                    $panel.hide();
                }

                $h.on('click.ft-accordion', function () {
                    var wasActive = $h.hasClass('ui-state-active');

                    /* Close all panels */
                    $headers.each(function () {
                        $(this).removeClass('ui-state-active');
                        $(this).next('div').hide();
                    });

                    /* Re-open this one unless it was active and collapsible */
                    if (!wasActive || !collapsible) {
                        $h.addClass('ui-state-active');
                        $panel.show();
                    }
                });
            });
        });
    };

}(jQuery));
