/*!
 * CollisionDetection - standalone (no jQuery dependency)
 * Based on jQuery Collision Detection v1.0 - 1/7/2014
 * http://www.hnldesign.nl/work/code/collision-prev…n-using-jquery/
 *
 * Copyright (c) 2014 HN Leussink
 * Dual licensed under the MIT and GPL licenses.
 *
 * FrameTrail: Added option includeVerticalMargins
 * FrameTrail: Converted from jQuery plugin to standalone function (no jQuery dep)
 */
(function (document, window) {
    'use strict';

    function CollisionDetection(el, opts) {
        this.container = el;
        this.defaults = {
            levelMemory:            { level: [], levelObjects: [] },
            spacing:                1,
            includeVerticalMargins: false,
            exclude:                null,
            containerPadding:       0
        };
        this.opts = Object.assign({}, this.defaults, opts);
        // Always use a fresh levelMemory so repeated calls don't share state
        this.opts.levelMemory = { level: [], levelObjects: [] };

        var exclude = this.opts.exclude;
        var children = Array.from(el.children);
        if (exclude) {
            children = children.filter(function (c) { return !c.matches(exclude); });
        }
        children.forEach(function (c) { delete c._cdLevel; });
        this.colliders = children;
        this.init();
    }

    CollisionDetection.prototype.init = function () {
        this.process(this.colliders);
    };

    CollisionDetection.prototype.sort = function (els) {
        var t = this;
        var sorted = els.slice().sort(function (a, b) {
            // Sort elements by left positioning, if same then by width
            var a_left  = a.offsetLeft,
                b_left  = b.offsetLeft,
                a_width = a.offsetWidth,
                b_width = b.offsetWidth;
            if (a_left === b_left) {
                return (a_width < b_width) ? -1 : (a_width > b_width) ? 1 : 0;
            }
            return (a_left < b_left) ? -1 : 1;
        });
        // Detach all sorted elements, then re-append in sorted order
        // (elements matching `exclude` remain in their original position)
        sorted.forEach(function (el) { el.remove(); });
        sorted.forEach(function (el) { t.container.appendChild(el); });
    };

    CollisionDetection.prototype.leveler = function (els) {
        var o = this.opts;

        function getNextSibling(el, exclude) {
            var next = el.nextElementSibling;
            while (next) {
                if (!exclude || !next.matches(exclude)) { return next; }
                next = next.nextElementSibling;
            }
            return null;
        }

        function outerHeight(el, includeMargins) {
            if (!includeMargins) { return el.offsetHeight; }
            var cs = getComputedStyle(el);
            return el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        }

        // FrameTrail Custom: check long overlapping elements
        function isLongElemOverlap() {
            // TODO: Implement check to improve performance.
            return true;
        }

        els.forEach(function (this_ele) {
            var next_ele = o.exclude
                ? getNextSibling(this_ele, o.exclude)
                : this_ele.nextElementSibling;

            var this_props = {
                height: outerHeight(this_ele, o.includeVerticalMargins),
                left:   this_ele.offsetLeft,
                width:  this_ele.offsetWidth
            };
            var next_props = next_ele ? {
                height: outerHeight(next_ele, o.includeVerticalMargins),
                left:   next_ele.offsetLeft,
                width:  next_ele.offsetWidth
            } : null;

            var thisLevel = parseInt(this_ele._cdLevel, 10), newLevel;
            if (isNaN(thisLevel)) {
                thisLevel = 0;
                this_ele._cdLevel = 0;
            }
            // Store amount of pixels 'filled' in this level
            o.levelMemory.level[thisLevel] = (this_props.left + this_props.width);

            // Level the next element
            if (next_ele) {
                if (((this_props.left + this_props.width) > next_props.left) || isLongElemOverlap()) {
                    o.levelMemory.level.some(function (filled, level) {
                        if (filled < next_props.left) {
                            newLevel = level;
                            return true; // break (Array.some: return true to stop)
                        }
                    });
                    if (newLevel === undefined) {
                        newLevel = o.levelMemory.level.length;
                    }
                }
                next_ele._cdLevel = newLevel;
            }

            // Push element into the right level object
            if (!o.levelMemory.levelObjects[thisLevel]) {
                o.levelMemory.levelObjects[thisLevel] = [];
            }
            o.levelMemory.levelObjects[thisLevel].push(this_ele);
        });
    };

    CollisionDetection.prototype.setDimensions = function () {
        var o = this.opts, t = this, prevHeight = 0, pad = o.containerPadding || 0;
        prevHeight += pad;

        // Set each level to the correct css bottom value
        o.levelMemory.levelObjects.forEach(function (levelEls, i) {
            prevHeight += o.spacing;
            var bottom = (i === 0 ? pad : prevHeight);
            var thisHeight = 0;
            levelEls.forEach(function (el) {
                el.style.bottom = bottom + 'px';
                var cs = getComputedStyle(el);
                var h = o.includeVerticalMargins
                    ? el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)
                    : el.offsetHeight;
                if (h > thisHeight) { thisHeight = h; }
            });
            prevHeight += thisHeight;
        });
        prevHeight += pad;

        // Set container to match height of elements inside
        t.container.style.height    = prevHeight + 'px';
        t.container.style.flexBasis = prevHeight + 'px';
    };

    CollisionDetection.prototype.process = function (els) {
        // Sort elements based on their appearance (left css property)
        this.sort(els);
        // Arrange elements into levels
        this.leveler(els);
        // Set dimensions
        this.setDimensions();
    };

    // Expose as a plain global function (replaces the old $.fn.CollisionDetection)
    window.CollisionDetection = function (el, opts) {
        new CollisionDetection(el, opts);
    };

}(document, window));
