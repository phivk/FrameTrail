/**
 * @module Player
 */


/**
 * I am the ViewLayout. I manage the layout areas wich contain ContentViews.
 *
 * @class ViewLayout
 * @static
 */



FrameTrail.defineModule('ViewLayout', function(FrameTrail){

    var labels = FrameTrail.module('Localization').labels;

    var configLayoutArea,

        /*
        areaTopContainer,
        areaTopDetails,

        areaBottomContainer,
        areaBottomDetails,

        areaLeftContainer,
        areaRightContainer,
        */

        contentViewsTop     = [],
        contentViewsBottom  = [],
        contentViewsLeft    = [],
        contentViewsRight   = [],

        managedAnnotations  = [],
        managedOverlays     = [],

        HypervideoLayoutContainer = FrameTrail.module('ViewVideo').HypervideoLayoutContainer,
        Hypervideo = FrameTrail.module('Database').hypervideo;


    function create() {

        configLayoutArea = FrameTrail.module('Database').hypervideo.config.layoutArea;

        /*
        areaTopContainer    = FrameTrail.module('ViewVideo').AreaTopContainer;
        areaTopDetails      = FrameTrail.module('ViewVideo').AreaTopDetails;
        areaBottomContainer = FrameTrail.module('ViewVideo').AreaBottomContainer;
        areaBottomDetails   = FrameTrail.module('ViewVideo').AreaBottomDetails;
        areaLeftContainer   = FrameTrail.module('ViewVideo').AreaLeftContainer;
        areaRightContainer  = FrameTrail.module('ViewVideo').AreaRightContainer;
        */

        for (var i in configLayoutArea.areaTop) {
            contentViewsTop.push(
                new FrameTrail.newObject('ContentView',
                    configLayoutArea.areaTop[i],
                    'top'));
        }

        for (var i in configLayoutArea.areaBottom) {
            contentViewsBottom.push(
                new FrameTrail.newObject('ContentView',
                    configLayoutArea.areaBottom[i],
                    'bottom'));
        }

        for (var i in configLayoutArea.areaLeft) {
            contentViewsLeft.push(
                new FrameTrail.newObject('ContentView',
                    configLayoutArea.areaLeft[i],
                    'left'));
        }

        for (var i in configLayoutArea.areaRight) {
            contentViewsRight.push(
                new FrameTrail.newObject('ContentView',
                    configLayoutArea.areaRight[i],
                    'right'));
        }

        updateLayoutAreaVisibility();

        updateManagedContent();

    }


    function updateLayoutAreaVisibility() {

        FrameTrail.changeState('hv_config_areaTopVisible', (contentViewsTop.length != 0));
        FrameTrail.changeState('hv_config_areaBottomVisible', (contentViewsBottom.length != 0));
        FrameTrail.changeState('hv_config_areaLeftVisible', (contentViewsLeft.length != 0));
        FrameTrail.changeState('hv_config_areaRightVisible', (contentViewsRight.length != 0));

    }


    function createContentView(whichArea, templateContentViewData, renderPreview, skipUndo) {

        var arrayOfContentViews = ({
            'top': contentViewsTop,
            'bottom': contentViewsBottom,
            'left': contentViewsLeft,
            'right': contentViewsRight
        })[whichArea];

        if (!Array.isArray(arrayOfContentViews)) {
            throw new Error('whichArea is string top/bottom/left/right');
        }

        var newContentView = new FrameTrail.newObject('ContentView', templateContentViewData, whichArea)

        arrayOfContentViews.push(newContentView);

        configLayoutArea[({
            'top': 'areaTop',
            'bottom': 'areaBottom',
            'left': 'areaLeft',
            'right': 'areaRight'
        })[whichArea]].push(newContentView.contentViewData);

        updateManagedContent();

        if (renderPreview) {
            newContentView.renderContentViewPreview(true);
        }

        updateLayoutAreaVisibility();

        return newContentView;

    }


    function removeContentView(contentViewToRemove, skipUndo) {

        // Capture data before removal for undo
        var contentViewData = JSON.parse(JSON.stringify(contentViewToRemove.contentViewData)),
            whichArea = contentViewToRemove.whichArea;

        var layoutAreaToRemovefrom = ({
            'top': contentViewsTop,
            'bottom': contentViewsBottom,
            'left': contentViewsLeft,
            'right': contentViewsRight
        })[contentViewToRemove.whichArea];

        // Also remove from config
        var configAreaName = ({
            'top': 'areaTop',
            'bottom': 'areaBottom',
            'left': 'areaLeft',
            'right': 'areaRight'
        })[whichArea];

        var configIndex = configLayoutArea[configAreaName].indexOf(contentViewToRemove.contentViewData);
        if (configIndex > -1) {
            configLayoutArea[configAreaName].splice(configIndex, 1);
        }

        contentViewToRemove.contentCollection.forEach(function(contentItem) {
            contentViewToRemove.removeContentCollectionElements(contentItem);
        });
        contentViewToRemove.removeDOMElement();

        layoutAreaToRemovefrom.splice(
            layoutAreaToRemovefrom.indexOf(contentViewToRemove),
            1
        );

        updateManagedContent();

        updateLayoutAreaVisibility();

        FrameTrail.module('HypervideoModel').newUnsavedChange('layout');

        // Register undo command
        if (!skipUndo) {
            var labels = FrameTrail.module('Localization').labels;
            FrameTrail.module('UndoManager').register({
                category: 'layout',
                description: labels['SidebarLayout'] + ' ' + labels['GenericDelete'],
                undo: function() {
                    var restoredContentView = createContentView(whichArea, contentViewData, true, true);
                    FrameTrail.module('HypervideoModel').newUnsavedChange('layout');
                },
                redo: function() {
                    // Find the content view by matching data
                    var contentViewsArray = ({
                        'top': contentViewsTop,
                        'bottom': contentViewsBottom,
                        'left': contentViewsLeft,
                        'right': contentViewsRight
                    })[whichArea];
                    for (var i = 0; i < contentViewsArray.length; i++) {
                        if (JSON.stringify(contentViewsArray[i].contentViewData) === JSON.stringify(contentViewData)) {
                            removeContentView(contentViewsArray[i], true);
                            break;
                        }
                    }
                }
            });
        }

    }


    function updateManagedContent() {

        managedAnnotations = [];
        managedOverlays    = [];

        var contentViewAreas = [
            contentViewsTop, contentViewsBottom, contentViewsLeft, contentViewsRight
        ];

        for (var a in contentViewAreas) {
            for (var i in contentViewAreas[a]) {
                var contentView = contentViewAreas[a][i];
                //console.log(contentView.whichArea, contentView.contentCollection);
                for (var k in contentView.contentCollection) {
                    var item = contentView.contentCollection[k];
                    if (item.overlayElement) {
                        managedOverlays.push([item, contentView]);
                    } else {
                        managedAnnotations.push([item, contentView]);
                    }
                }
            }
        }

        //console.log(managedAnnotations);

    }


    function updateContentInContentViews() {
        var contentViewAreas = [
            contentViewsTop, contentViewsBottom, contentViewsLeft, contentViewsRight
        ];

        for (var a in contentViewAreas) {
            for (var i in contentViewAreas[a]) {
                var contentView = contentViewAreas[a][i];
                contentView.updateContent(true);
            }
        }

        var currentTime = FrameTrail.module('HypervideoController').currentTime;
        updateTimedStateOfContentViews(currentTime);
    }


    function updateTimedStateOfContentViews(currentTime) {

        var self = this;

        for (var idx in managedAnnotations) {
            var annotation  = managedAnnotations[idx][0],
                contentView = managedAnnotations[idx][1];

            if (    annotation.data.start <= currentTime
                 && annotation.data.end   >= currentTime) {

                if (!annotation.activeStateInContentView(contentView)) {
                    annotation.setActiveInContentView(contentView);
                }

            } else {

                if (annotation.activeStateInContentView(contentView)) {
                    annotation.setInactiveInContentView(contentView);
                }

            }

        }

        for (var idx in managedOverlays) {
            var overlay     = managedOverlays[idx][0],
                contentView = managedOverlays[idx][1];

            if (    overlay.data.start <= currentTime
                 && overlay.data.end   >= currentTime) {

                if (!overlay.activeStateInContentView(contentView)) {
                    overlay.setActiveInContentView(contentView);
                }

            } else {

                if (overlay.activeStateInContentView(contentView)) {
                    overlay.setInactiveInContentView(contentView);
                }

            }

        }

        for (var i in contentViewsTop) {
            contentViewsTop[i].updateTimedStateOfContentViews(currentTime);
        }
        for (var i in contentViewsBottom) {
            contentViewsBottom[i].updateTimedStateOfContentViews(currentTime);
        }
        for (var i in contentViewsLeft) {
            contentViewsLeft[i].updateTimedStateOfContentViews(currentTime);
        }
        for (var i in contentViewsRight) {
            contentViewsRight[i].updateTimedStateOfContentViews(currentTime);
        }

    }


    function initLayoutManager() {
        
        HypervideoLayoutContainer.innerHTML = '';

        var database   = FrameTrail.module('Database'),
            hypervideo = database.hypervideo,
            thisID     = FrameTrail.module('RouteNavigation').hypervideoID;

        var currentTheme = hypervideo.config.theme || database.config.theme || 'default';

        var _lmWrapper = document.createElement('div');
        _lmWrapper.innerHTML = '<div class="layoutManagerContainer">' +
            '    <div class="layoutManagerMain">' +
            '        <div class="layoutManager">' +
            '            <div data-area="areaTop" class="layoutArea">' +
            '                <div class="layoutAreaTabs"></div>' +
            '                <div class="layoutAreaContent"></div>' +
            '            </div>' +
            '            <div class="playerWrapper">' +
            '                <div data-area="areaLeft" class="layoutArea">' +
            '                    <div class="layoutAreaTabs"></div>' +
            '                    <div class="layoutAreaContent"></div>' +
            '                </div>' +
            '                <div class="playerArea">' +
            '                    <span class="icon-play-1"></span>' +
            '                </div>' +
            '                <div data-area="areaRight" class="layoutArea">' +
            '                    <div class="layoutAreaTabs"></div>' +
            '                    <div class="layoutAreaContent"></div>' +
            '                </div>' +
            '            </div>' +
            '            <div data-area="areaBottom" class="layoutArea">' +
            '                <div class="layoutAreaTabs"></div>' +
            '                <div class="layoutAreaContent"></div>' +
            '            </div>' +
            '        </div>' +
            '        <div class="layoutManagerThemePanel">' +
            '            <div class="themeContainer">' +
            '                <div class="message active">'+ labels['SettingsSelectColorTheme'] +'</div>' +
            '                <div class="themeItem" data-theme="default">' +
            '                    <div class="themeName">'+ labels['GenericDefault'] +'</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="dark">' +
            '                    <div class="themeName">Dark</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="bright">' +
            '                    <div class="themeName">Bright</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="blue">' +
            '                    <div class="themeName">Blue</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="green">' +
            '                    <div class="themeName">Green</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="orange">' +
            '                    <div class="themeName">Orange</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '                <div class="themeItem" data-theme="grey">' +
            '                    <div class="themeName">Grey</div>' +
            '                    <div class="themeColorContainer">' +
            '                        <div class="primary-fg-color"></div>' +
            '                        <div class="secondary-bg-color"></div>' +
            '                        <div class="secondary-fg-color"></div>' +
            '                    </div>' +
            '                </div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="layoutManagerOptions">' +
            '        <div class="message active">'+ labels['MessageLayoutManagerDropContentViews'] +'</div>' +
            '        <div class="contentViewTemplate" data-type="TimedContent" data-size="small">' +
            '            <div class="contentViewTemplateType"><span class="icon-docs">'+ labels['GenericAnnotationCollection'] +'</span></div>' +
            '            <div class="contentViewTemplateSize"><span class="icon-coverflow"></span></div>' +
            '        </div>' +
            '        <div class="contentViewTemplate" data-type="TimedContent" data-size="medium">' +
            '            <div class="contentViewTemplateType"><span class="icon-docs">'+ labels['GenericAnnotationCollection'] +'</span></div>' +
            '            <div class="contentViewTemplateSize"><span class="icon-coverflow"></span></div>' +
            '        </div>' +
            '        <div class="contentViewTemplate" data-type="TimedContent" data-size="large">' +
            '            <div class="contentViewTemplateType"><span class="icon-docs">'+ labels['GenericAnnotationCollection'] +'</span></div>' +
            '            <div class="contentViewTemplateSize"><span class="icon-coverflow"></span></div>' +
            '        </div>' +
            '        <div class="contentViewTemplate" data-type="CustomHTML" data-size="medium">' +
            '            <div class="contentViewTemplateType"><span class="icon-file-code">'+ labels['GenericCustomHTML'] +'</span></div>' +
            '        </div>' +
            '        <div class="contentViewTemplate" data-type="Transcript" data-size="large">' +
            '            <div class="contentViewTemplateType"><span class="icon-doc-text">'+ labels['GenericTextTranscript'] +'</span></div>' +
            '        </div>' +
            '        <div class="contentViewTemplate" data-type="Timelines" data-size="large">' +
            '            <div class="contentViewTemplateType"><span class="icon-doc-text">'+ labels['GenericTimelines'] +'</span></div>' +
            '        </div>' +
            '    </div>' +
            '</div>';
        var domElement = _lmWrapper.firstElementChild,
        LayoutManager        = domElement.querySelector('.layoutManager'),
        LayoutManagerOptions = domElement.querySelector('.layoutManagerOptions'),
        self = this;

        HypervideoLayoutContainer.append(domElement);

        // Layout template drag-and-drop via interact.js (clone helper pattern)
        (function() {
            var dragClone = null;

            var draggableListeners = {
            listeners: {
                start: function(e) {
                    var el = e.target;
                    var rect = el.getBoundingClientRect();
                    dragClone = el.cloneNode(true);
                    dragClone.style.cssText = 'position:fixed;z-index:1000;pointer-events:none;width:' + rect.width + 'px;left:' + rect.left + 'px;top:' + rect.top + 'px;';
                    document.body.appendChild(dragClone);
                },
                move: function(e) {
                    // Only move the floating clone — original stays in place as visual placeholder
                    if (dragClone) {
                        dragClone.style.left = (parseFloat(dragClone.style.left) + e.dx) + 'px';
                        dragClone.style.top  = (parseFloat(dragClone.style.top)  + e.dy) + 'px';
                    }
                },
                end: function(e) {
                    if (dragClone) { dragClone.remove(); dragClone = null; }
                }
            }
        };
        LayoutManagerOptions.querySelectorAll('.contentViewTemplate').forEach(function(el) { interact(el).draggable(draggableListeners); });

        var dropzoneOpts = {
                accept: '.contentViewTemplate, .contentViewPreview',
                overlap: 'pointer',
                ondropactivate:   function(e) { e.target.classList.add('droppableActive'); },
                ondropdeactivate: function(e) { e.target.classList.remove('droppableActive', 'droppableHover'); },
                ondragenter:      function(e) { e.target.classList.add('droppableHover'); },
                ondragleave:      function(e) { e.target.classList.remove('droppableHover'); },
                ondrop: function(e) {
                    var orig = e.relatedTarget;
                    var layoutArea = e.target.parentElement.dataset.area,
                        contentAxis = (layoutArea == 'areaTop' || layoutArea == 'areaBottom') ? 'x' : 'y',
                        templateContentViewData = {
                            'type': orig.dataset.type,
                            'name': '',
                            'description': '',
                            'cssClass': '',
                            'html': '',
                            'collectionFilter': {
                                'tags': [],
                                'types': [],
                                'text': '',
                                'users': []
                            },
                            'transcriptSource': '',
                            'mode': 'slide',
                            'axis': contentAxis,
                            'contentSize': orig.dataset.size || '',
                            'autoSync': false,
                            'onClickContentItem': ''
                        };

                    var whichArea = layoutArea.split('area')[1].toLowerCase(),
                        renderPreview = true;

                    var newContentView = createContentView(whichArea, templateContentViewData, renderPreview);

                    FrameTrail.module('HypervideoModel').newUnsavedChange('layout');

                    // Register undo command for adding content view
                    (function(areaName, viewData) {
                        var findContentView = function() {
                            var contentViewsArray = ({
                                'top': contentViewsTop,
                                'bottom': contentViewsBottom,
                                'left': contentViewsLeft,
                                'right': contentViewsRight
                            })[areaName];
                            for (var i = 0; i < contentViewsArray.length; i++) {
                                if (JSON.stringify(contentViewsArray[i].contentViewData) === JSON.stringify(viewData)) {
                                    return contentViewsArray[i];
                                }
                            }
                            return null;
                        };
                        FrameTrail.module('UndoManager').register({
                            category: 'layout',
                            description: labels['SidebarLayout'] + ' ' + labels['GenericAdd'],
                            undo: function() {
                                var contentView = findContentView();
                                if (contentView) {
                                    removeContentView(contentView, true);
                                }
                            },
                            redo: function() {
                                createContentView(areaName, viewData, true, true);
                                FrameTrail.module('HypervideoModel').newUnsavedChange('layout');
                            }
                        });
                    })(whichArea, JSON.parse(JSON.stringify(templateContentViewData)));
                }
        };
        LayoutManager.querySelectorAll('.layoutAreaContent').forEach(function(el) { interact(el).dropzone(dropzoneOpts); });
        }());

        initLayoutAreaPreview(contentViewsTop);
        initLayoutAreaPreview(contentViewsBottom);
        initLayoutAreaPreview(contentViewsLeft);
        initLayoutAreaPreview(contentViewsRight);


        // Theme selector
    var themePanel = domElement.querySelector('.layoutManagerThemePanel');

    themePanel.querySelectorAll('.themeItem').forEach(function(item) {
        if (currentTheme === item.dataset.theme) {
            item.classList.add('active');
        }
    });

    themePanel.addEventListener('click', function(evt) {
        var el = evt.target.closest('.themeItem');
        if (!el) { return; }

        var newTheme = el.dataset.theme,
            oldTheme = hypervideo.config.theme || '';

        if (newTheme === oldTheme || (!oldTheme && newTheme === (database.config.theme || 'default'))) {
            return;
        }

        themePanel.querySelectorAll('.themeItem').forEach(function(item) { item.classList.remove('active'); });
        el.classList.add('active');

        // Apply theme immediately
        hypervideo.config.theme = newTheme;
        document.querySelector(FrameTrail.getState('target')).setAttribute('data-frametrail-theme', newTheme);

        FrameTrail.module('HypervideoModel').newUnsavedChange('layout');

        // Register undo/redo
        (function(prevTheme, nextTheme) {
            FrameTrail.module('UndoManager').register({
                category: 'layout',
                description: labels['SidebarLayout'] + ' Theme',
                undo: function() {
                    hypervideo.config.theme = prevTheme;
                    document.querySelector(FrameTrail.getState('target')).setAttribute('data-frametrail-theme', prevTheme || database.config.theme || 'default');
                    themePanel.querySelectorAll('.themeItem').forEach(function(item) { item.classList.remove('active'); });
                    var prevItem = themePanel.querySelector('.themeItem[data-theme="'+ (prevTheme || database.config.theme || 'default') +'"]');
                    if (prevItem) { prevItem.classList.add('active'); }
                    FrameTrail.module('HypervideoModel').newUnsavedChange('layout');
                },
                redo: function() {
                    hypervideo.config.theme = nextTheme;
                    document.querySelector(FrameTrail.getState('target')).setAttribute('data-frametrail-theme', nextTheme);
                    themePanel.querySelectorAll('.themeItem').forEach(function(item) { item.classList.remove('active'); });
                    var nextItem = themePanel.querySelector('.themeItem[data-theme="'+ nextTheme +'"]');
                    if (nextItem) { nextItem.classList.add('active'); }
                    FrameTrail.module('HypervideoModel').newUnsavedChange('layout');
                }
            });
        })(oldTheme, newTheme);
    });


    }


    /**
     * I initialize a LayoutArea Preview and trigger initialization of its ContentViews.
     *
     * @method initLayoutAreaPreview
     * @param {Array} contentViews
     */
    function initLayoutAreaPreview(contentViews) {

        for (var i=0; i < contentViews.length; i++) {
            contentViews[i].renderContentViewPreview();
        }

    }



    /**
     * I return the data of all ContentViews in all LayoutAreas.
     *
     * @method getLayoutAreaData
     * @return {Object} layoutAreaData
     */
    function getLayoutAreaData() {

        var layoutAreaData = {
            'areaTop': (function() {
                var contentViewDataTop = [];
                for (var i=0; i<contentViewsTop.length; i++) {
                    contentViewDataTop.push(contentViewsTop[i].contentViewData);
                }
                return contentViewDataTop;
            })(),
            'areaBottom': (function() {
                var contentViewDataBottom = [];
                for (var i=0; i<contentViewsBottom.length; i++) {
                    contentViewDataBottom.push(contentViewsBottom[i].contentViewData);
                }
                return contentViewDataBottom;
            })(),
            'areaLeft': (function() {
                var contentViewDataLeft = [];
                for (var i=0; i<contentViewsLeft.length; i++) {
                    contentViewDataLeft.push(contentViewsLeft[i].contentViewData);
                }
                return contentViewDataLeft;
            })(),
            'areaRight': (function() {
                var contentViewDataRight = [];
                for (var i=0; i<contentViewsRight.length; i++) {
                    contentViewDataRight.push(contentViewsRight[i].contentViewData);
                }
                return contentViewDataRight;
            })()
        };

        return layoutAreaData;

    }


    /**
     * I initialize a LayoutArea Preview and trigger initialization of its ContentViews.
     *
     * @method initLayoutAreaPreview
     * @param {Array} contentViews
     */
    function initLayoutAreaPreview(contentViews) {

        for (var i=0; i < contentViews.length; i++) {
            contentViews[i].renderContentViewPreview();
        }

    }


    /**
     * I return the data of all ContentViews in all LayoutAreas.
     *
     * @method getLayoutAreaData
     * @return {Object} layoutAreaData
     */
    function getLayoutAreaData() {

        var layoutAreaData = {
            'areaTop': (function() {
                var contentViewDataTop = [];
                for (var i=0; i<contentViewsTop.length; i++) {
                    contentViewDataTop.push(contentViewsTop[i].contentViewData);
                }
                return contentViewDataTop;
            })(),
            'areaBottom': (function() {
                var contentViewDataBottom = [];
                for (var i=0; i<contentViewsBottom.length; i++) {
                    contentViewDataBottom.push(contentViewsBottom[i].contentViewData);
                }
                return contentViewDataBottom;
            })(),
            'areaLeft': (function() {
                var contentViewDataLeft = [];
                for (var i=0; i<contentViewsLeft.length; i++) {
                    contentViewDataLeft.push(contentViewsLeft[i].contentViewData);
                }
                return contentViewDataLeft;
            })(),
            'areaRight': (function() {
                var contentViewDataRight = [];
                for (var i=0; i<contentViewsRight.length; i++) {
                    contentViewDataRight.push(contentViewsRight[i].contentViewData);
                }
                return contentViewDataRight;
            })()
        };

        return layoutAreaData;

    }


    /**
     * I initialize a LayoutArea Preview and trigger initialization of its ContentViews.
     *
     * @method initLayoutAreaPreview
     * @param {Array} contentViews
     */
    function initLayoutAreaPreview(contentViews) {

        for (var i=0; i < contentViews.length; i++) {
            contentViews[i].renderContentViewPreview();
        }

    }

    /**
     * I initialize a LayoutArea Preview and trigger initialization of its ContentViews.
     *
     * @method initLayoutAreaPreview
     * @param {Array} contentViews
     */
    function initLayoutAreaPreview(contentViews) {

        for (var i=0; i < contentViews.length; i++) {
            contentViews[i].renderContentViewPreview();
        }

    }



    /**
     * I return the data of all ContentViews in all LayoutAreas.
     *
     * @method getLayoutAreaData
     * @return {Object} layoutAreaData
     */
    function getLayoutAreaData() {

        var layoutAreaData = {
            'areaTop': (function() {
                var contentViewDataTop = [];
                for (var i=0; i<contentViewsTop.length; i++) {
                    contentViewDataTop.push(contentViewsTop[i].contentViewData);
                }
                return contentViewDataTop;
            })(),
            'areaBottom': (function() {
                var contentViewDataBottom = [];
                for (var i=0; i<contentViewsBottom.length; i++) {
                    contentViewDataBottom.push(contentViewsBottom[i].contentViewData);
                }
                return contentViewDataBottom;
            })(),
            'areaLeft': (function() {
                var contentViewDataLeft = [];
                for (var i=0; i<contentViewsLeft.length; i++) {
                    contentViewDataLeft.push(contentViewsLeft[i].contentViewData);
                }
                return contentViewDataLeft;
            })(),
            'areaRight': (function() {
                var contentViewDataRight = [];
                for (var i=0; i<contentViewsRight.length; i++) {
                    contentViewDataRight.push(contentViewsRight[i].contentViewData);
                }
                return contentViewDataRight;
            })()
        }

        return layoutAreaData;

    }


    /**
     * I am called when the global state "viewSize" changes (which it does after a window resize,
     * and one time during app start, after all create methods of interface modules have been called).
     * @method changeViewSize
     * @param {Array} arrayWidthAndHeight
     */
    function changeViewSize(arrayWidthAndHeight) {

        adjustContentViewLayout();

    }


    /**
     * I adjust the layout (sizes, positioning etc.) of all contentViews.
     * @method adjustContentViewLayout
     */
    function adjustContentViewLayout() {

        if ( FrameTrail.getState('viewMode') != 'video' ) {
            return;
        }

        var allAreas = [contentViewsTop, contentViewsBottom, contentViewsLeft, contentViewsRight];

        for (var a = 0; a < allAreas.length; a++) {
            for (var i in allAreas[a]) {
                allAreas[a][i].updateLayout();
            }
            // Sync the area container data-size with the active content view
            for (var i in allAreas[a]) {
                if (allAreas[a][i].contentViewContainer.classList.contains('active')) {
                    allAreas[a][i].resizeLayoutArea(false, true);
                    break;
                }
            }
        }

    }


    /**
     * I react to changes in the global state viewSizeChanged.
     * The state changes after a window resize event
     * and is meant to be used for performance-heavy operations.
     *
     * @method onViewSizeChanged
     * @private
     */
    function onViewSizeChanged() {

        if ( FrameTrail.getState('viewMode') != 'video' ) {
            return;
        }

        //TODO: CHECK WHY THIS THROWS ERROR RIGHT AFTER DELETING A CONTENT VIEW
        var currentTime = FrameTrail.module('HypervideoController').currentTime;
        updateTimedStateOfContentViews(currentTime);

        if ( FrameTrail.module('ViewVideo').shownDetails == 'top' ) {
            for (var i in contentViewsTop) {
                contentViewsTop[i].updateCollectionSlider(true);
            }
        } else if ( FrameTrail.module('ViewVideo').shownDetails == 'bottom' ) {
            for (var i in contentViewsBottom) {
                contentViewsBottom[i].updateCollectionSlider(true);
            }
        }

    }


    /**
     * When the state of the sidebar changes, I have to re-arrange
     * the tileElements and the annotationElements, to fit the new
     * width of the #mainContainer.
     * @method toggleSidebarOpen
     * @private
     */
    function toggleSidebarOpen() {


        var maxSlideDuration = 280,
            interval;

        interval = window.setInterval(function(){
            changeViewSize(FrameTrail.getState('viewSize'));
        }, 40);

        window.setTimeout(function(){

            window.clearInterval(interval);

        }, maxSlideDuration);


    }


    /**
     * When we enter the viewMode 'video', we have to update the
     * distribution of tiles accoring to the current browser width.
     * @method toggleViewMode
     * @param {String} viewMode
     * @param {String} oldViewMode
     * @return
     */
    function toggleViewMode(viewMode, oldViewMode){

        if (viewMode === 'video' && oldViewMode !== 'video') {
            window.setTimeout(function() {
                changeViewSize(FrameTrail.getState('viewSize'));
            }, 300);
        }

    }



    /**
     * I am called when the global state "slidePosition" changes.
     *
     * This state is either "top", "middle" or "bottom", and indicates, which area has the most visual weight.
     * The Hypervideocontainer is always displayed in the middle (in different sizes).
     *
     * @method changeSlidePosition
     * @param {String} newState
     * @param {String} oldState
     */
    function onChangeSlidePosition(newState, oldState) {

            if ( newState == 'middle' ) {
            var _targetEl = document.querySelector(FrameTrail.getState('target'));
            _targetEl.querySelectorAll('.viewVideo .collectionElement.open').forEach(function(el) {
                el.classList.remove('open');
            });
        };

    }



    return {

        onChange: {
            viewSize:        changeViewSize,
            viewSizeChanged: onViewSizeChanged,
            sidebarOpen:     toggleSidebarOpen,
            viewMode:        toggleViewMode,
            slidePosition:   onChangeSlidePosition
        },

        create: create,

        createContentView: createContentView,
        removeContentView: removeContentView,

        updateManagedContent: updateManagedContent,

        updateContentInContentViews: updateContentInContentViews,
        adjustContentViewLayout: adjustContentViewLayout,

        updateTimedStateOfContentViews: updateTimedStateOfContentViews,

        initLayoutManager: initLayoutManager,

        getLayoutAreaData: getLayoutAreaData,

    };

});
