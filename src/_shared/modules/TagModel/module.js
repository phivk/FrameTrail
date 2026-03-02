/**
 * @module Shared
 */

/**
 * I am the TagModel.
 * I manage the tag definitions stored on the server, and localize their labels and descriptions.
 *
 * I query the {{#crossLink "HypervideoModel"}}HypervideoModel{{/crossLink}} for filtered collections of Overlays and Annotations
 *
 * @class TagModel
 * @static
 */

 FrameTrail.defineModule('TagModel', function(FrameTrail){

    function _serverPost(body) {
        return fetch('_server/ajaxServer.php', {
            method: 'POST',
            cache: (config.allowCaching) ? 'default' : 'no-cache',
            body: body
        }).then(function(r) {
            return r.json();
        }).then(function(json) {
            if (json.status === 'fail') {
                return Promise.reject(json);
            }
            return json;
        });
    }

    var labels = FrameTrail.module('Localization').labels;
    
    var tags        = {},
        config      = {};

    function initTagModel (success, fail) {

        config = FrameTrail.getState('config');
        updateTagModel(success, fail);

    }

    function updateTagModel (success, fail) {

        var tagInitOptions = FrameTrail.getState('tagdefinitions');

        if (typeof tagInitOptions === 'object' && tagInitOptions !== null) {

            tags = tagInitOptions;

            return success();

        }

        if (FrameTrail.getState('storageMode') === 'local' || FrameTrail.getState('storageMode') === 'download') {
            var adapter = FrameTrail.module('StorageManager').getAdapter();
            adapter.readJSON('tagdefinitions.json').then(function(data) {
                tags = data;
                success();
            }).catch(function() {
                // No tag definitions file — start with empty tags
                tags = {};
                success();
            });
            return;
        }

        var tagUrl = typeof tagInitOptions === 'string' ? tagInitOptions : '_data/tagdefinitions.json';
        fetch(tagUrl, { cache: (config.allowCaching) ? 'default' : 'no-cache' })
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(data) {
                tags = data;
                success();
            })
            .catch(function(err) {
                fail(labels['ErrorNoTagdefinitionsFile']);
            });

    }


    function getAllTagLabelsAndDescriptions (language) {

        var result = {};

        for (var tagname in tags) {
            result[tagname] = tags[tagname][language];
        }

        return result;

    }

    function getTagLabelAndDescription (tagname, language) {
        return tags[tagname][language];
    }


    function setTag (tagname, language, label, description, success, fail) {

        if (FrameTrail.getState('storageMode') === 'local' || FrameTrail.getState('storageMode') === 'download') {
            var adapter = FrameTrail.module('StorageManager').getAdapter();
            adapter.readJSON('tagdefinitions.json').catch(function() { return {}; }).then(function(data) {
                if (!data[tagname]) { data[tagname] = {}; }
                data[tagname][language] = { label: label, description: description };
                return adapter.writeJSON('tagdefinitions.json', data);
            }).then(function() {
                updateTagModel(success, fail);
            }).catch(fail);
            return;
        }

        _serverPost(new URLSearchParams({ a: 'tagSet', tagName: tagname, lang: language, label: label, description: description }))
        .then(function() { updateTagModel(success, fail); })
        .catch(fail);

    }

    function deleteLang (tagname, language, success, fail) {

        if (FrameTrail.getState('storageMode') === 'local' || FrameTrail.getState('storageMode') === 'download') {
            var adapter = FrameTrail.module('StorageManager').getAdapter();
            adapter.readJSON('tagdefinitions.json').catch(function() { return {}; }).then(function(data) {
                if (data[tagname]) {
                    delete data[tagname][language];
                    if (Object.keys(data[tagname]).length === 0) { delete data[tagname]; }
                }
                return adapter.writeJSON('tagdefinitions.json', data);
            }).then(function() {
                updateTagModel(success, fail);
            }).catch(fail);
            return;
        }

        _serverPost(new URLSearchParams({ a: 'tagLangDelete', tagName: tagname, language: language }))
        .then(function() { updateTagModel(success, fail); })
        .catch(fail);

    }

    function deleteTag (tagname, success, fail) {

        if (FrameTrail.getState('storageMode') === 'local' || FrameTrail.getState('storageMode') === 'download') {
            var adapter = FrameTrail.module('StorageManager').getAdapter();
            adapter.readJSON('tagdefinitions.json').catch(function() { return {}; }).then(function(data) {
                delete data[tagname];
                return adapter.writeJSON('tagdefinitions.json', data);
            }).then(function() {
                updateTagModel(function() {
                    success({ code: 0, string: 'Tag deleted' });
                }, fail);
            }).catch(fail);
            return;
        }

        _serverPost(new URLSearchParams({ a: 'tagDelete', tagName: tagname }))
        .then(function(data) {
            updateTagModel(function() {
                success(data);
            }, fail);
        })
        .catch(function(data) {
            if (fail) fail(data);
        });

    }

    function getAllTags() {
        return tags;
    }


    function getContentCollection (
        arrayOfTagnames, // if empty, collect all items regardless of tagname
        overlays, // bool
        annotations, // bool
        arrayOfUserIDsForAnnotations,
        searchText,
        arrayOfContentTypes // frametrail:type
    ) {

        var result = FrameTrail.module('HypervideoModel').annotations.filter(function (annotationItem) {

            var match = false,
                annotationData = annotationItem.data;

            if (arrayOfTagnames.length === 0) {
                match = true
            } else {
                for (var i in annotationData.tags) {
                    if (arrayOfTagnames.indexOf( annotationData.tags[i] ) > -1) {
                        //console.log('tag', annotationData.tags[i]);
                        match = true;
                        break;
                    }
                }
            }

            // empty arrayOfUserIDsForAnnotations means no filtering by user ids
            if (arrayOfUserIDsForAnnotations.length > 0) {
                if (arrayOfUserIDsForAnnotations.indexOf('_currentUser') != -1 
                    && FrameTrail.module('UserManagement').userID.length > 0) {
                    arrayOfUserIDsForAnnotations[arrayOfUserIDsForAnnotations.indexOf('_currentUser')] = FrameTrail.module('UserManagement').userID;
                }
                if (arrayOfUserIDsForAnnotations.map(String).indexOf(String(annotationData.creatorId)) < 0) {
                    //console.log(annotationData.creatorId);
                    match = false;
                }
            }

            // empty arrayOfContentTypes means no filtering by content types
            if (arrayOfContentTypes.length > 0) {
                if (arrayOfContentTypes.indexOf(annotationData.type) < 0) {
                    //console.log(annotationData.type);
                    match = false;
                }
            }

            // empty searchText string means no filtering by search text
            if (searchText.length > 0) {
                if (annotationData.name.toLowerCase().indexOf(searchText.toLowerCase()) < 0) {
                    match = false;
                }
            }

            return match;

        });

        if (overlays) {
            result.concat(FrameTrail.module('HypervideoModel').overlays.filter(function (overlayItem) {

                var match = false,
                    overlayData = overlayItem.data;

                if (arrayOfTagnames.length === 0) {
                    match = true
                } else {
                    for (var i in overlayData.tags) {
                        if (arrayOfTagnames.indexOf( overlayData.tags[i] ) > -1) {
                            match = true;
                            break;
                        }
                    }
                }

                // empty arrayOfUserIDsForAnnotations means no filtering by user ids
                if (arrayOfUserIDsForAnnotations.length > 0) {
                    if (arrayOfUserIDsForAnnotations.map(String).indexOf(String(overlayData.creatorId)) < 0) {
                        match = false;
                    }
                }

                if (arrayOfContentTypes.indexOf(overlayData.type) < 0) {
                    match = false;
                }

                if (searchText) {
                    if (overlayData.name.indexOf(searchText) < 0) {
                        match = false;
                    }
                }

                return match;

            }));
        }

        return result;

    }




    return {
        initTagModel: initTagModel,
        updateTagModel: updateTagModel,

        getAllTags: getAllTags,
        getAllTagLabelsAndDescriptions: getAllTagLabelsAndDescriptions,
        getTagLabelAndDescription: getTagLabelAndDescription,

        setTag: setTag,
        deleteLang: deleteLang,
        deleteTag: deleteTag,

        getContentCollection: getContentCollection,
    }

});
