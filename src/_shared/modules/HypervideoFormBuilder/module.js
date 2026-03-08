/**
 * @module Shared
 */

/**
 * I am the HypervideoFormBuilder. I provide shared form HTML generation
 * for hypervideo dialogs (new and edit).
 *
 * @class HypervideoFormBuilder
 * @static
 */

FrameTrail.defineModule('HypervideoFormBuilder', function(FrameTrail){

    /**
     * Get localization labels (lazy access to avoid initialization issues)
     * @method getLabels
     * @return {Object} labels object
     */
    function getLabels() {
        return FrameTrail.module('Localization').labels;
    }

    /**
     * Convert seconds to HH:MM:SS time string
     * @method secondsToTimeString
     * @param {Number} totalSeconds
     * @return {String} time string in HH:MM:SS format
     */
    function secondsToTimeString(totalSeconds) {
        var h = Math.floor(totalSeconds / 3600);
        var m = Math.floor((totalSeconds % 3600) / 60);
        var s = Math.floor(totalSeconds % 60);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    /**
     * Convert HH:MM:SS time string to total seconds
     * @method timeStringToSeconds
     * @param {String} timeString - time in HH:MM:SS format
     * @return {Number} total seconds
     */
    function timeStringToSeconds(timeString) {
        if (!timeString) return 0;
        var parts = timeString.split(':');
        var h = parseInt(parts[0]) || 0;
        var m = parseInt(parts[1]) || 0;
        var s = parseInt(parts[2]) || 0;
        return h * 3600 + m * 60 + s;
    }

    /**
     * Generate the settings row HTML (basic info + subtitles in one row)
     * @method generateSettingsRow
     * @param {Object} options - {
     *   name: '',
     *   captionsVisible: false,
     *   autohideControls: false,
     *   showExistingSubtitles: false
     * }
     * @return {String} HTML string
     */
    function generateSettingsRow(options) {
        var labels = getLabels();
        options = options || {};
        var name = options.name || '';
        var captionsVisible = options.captionsVisible || false;
        var autohideControls = options.autohideControls || false;
        var showExistingSubtitles = options.showExistingSubtitles || false;

        var html = '<div class="layoutRow">'
                 // Column 1: Name & options
                 + '    <div class="column-3">'
                 + '        <label for="name">'+ labels['SettingsHypervideoName'] +'</label>'
                 + '        <input type="text" name="name" placeholder="'+ labels['SettingsHypervideoName'] +'" value="'+ name +'"><br>'
                 + '        <input type="checkbox" name="config[autohideControls]" id="autohideControls" '+ (autohideControls ? 'checked' : '') +'>'
                 + '        <label for="autohideControls">'+ labels['SettingsAutohideControls'] +'</label>'
                 + '    </div>'
                 // Column 2: Subtitles
                 + '    <div class="column-9">'
                 + '        <div class="subtitlesSettingsWrapper">'
                 + '            <div>'+ labels['GenericSubtitles'] +' ('+ labels['MessageSubtitlesAlsoUsedForInteractiveTranscripts'] +')</div>'
                 + '            <button class="subtitlesPlus" type="button">'+ labels['GenericAdd'] +' <span class="icon-plus"></span></button>'
                 + '            <input type="checkbox" name="config[captionsVisible]" id="captionsVisible" value="true" '+ (captionsVisible ? 'checked' : '') +'>'
                 + '            <label for="captionsVisible">'+ labels['SettingsSubtitlesShowByDefault'] +'</label>';

        if (showExistingSubtitles) {
            html += '            <div class="existingSubtitlesContainer"></div>';
        }

        html += '            <div class="newSubtitlesContainer"></div>'
              + '        </div>'
              + '    </div>'
              + '</div>';

        return html;
    }

    /**
     * Generate the video source section HTML
     * @method generateVideoSourceSection
     * @param {Object} options - { 
     *   duration: 120,  // Duration in seconds (default 2 minutes)
     *   currentResourceId: null,
     *   currentSrc: null,
     *   showUploadButton: true,
     *   isEditMode: false  // If true, includes newResourceId/Src/Duration hidden inputs
     * }
     * @return {String} HTML string
     */
    function generateVideoSourceSection(options) {
        var labels = getLabels();
        options = options || {};
        // Default duration is 2 minutes (120 seconds)
        var duration = options.duration !== undefined ? options.duration : 120;
        var durationTimeString = secondsToTimeString(duration);
        var currentResourceId = options.currentResourceId || '';
        var currentSrc = options.currentSrc || '';
        var showUploadButton = options.showUploadButton !== false;
        var isEditMode = options.isEditMode || false;

        var html = '<div class="videoSourceSection">'
                 + '    <div>'+ labels['SettingsVideoSource'] +'</div>'
                 + '    <div class="videoSourceTabs">'
                 + '        <ul>'
                 + '            <li><a href="#ChooseVideo">'+ labels['SettingsChooseVideo'] +'</a></li>'
                 + '            <li><a href="#EmptyVideo">'+ labels['GenericEmptyVideo'] +'</a></li>'
                 + '        </ul>'
                 + '        <div id="ChooseVideo">';

        if (showUploadButton) {
            html += '            <button type="button" class="uploadNewVideoResource">'+ labels['ResourceUploadVideo'] +'</button>';
        }

        html += '            <div class="videoResourceList"></div>'
              + '            <input type="hidden" name="resourcesID" value="'+ currentResourceId +'">'
              + '        </div>'
              + '        <div id="EmptyVideo">'
              + '            <div class="message active">'+ labels['MessageEmptyVideoSetDuration'] +'</div>'
              + '            <label>'+ labels['GenericDuration'] +':</label>'
              + '            <input type="time" name="duration" step="1" min="00:00:04" value="'+ durationTimeString +'">'
               + '            <label>(HH:MM:SS)</label>'
              + '        </div>'
              + '    </div>';

        // Edit mode needs additional hidden inputs for tracking source changes
        if (isEditMode) {
            html += '    <input type="hidden" name="newResourceId" value="'+ currentResourceId +'">'
                  + '    <input type="hidden" name="newResourceSrc" value="'+ currentSrc +'">'
                  + '    <input type="hidden" name="newResourceDuration" value="">';
        }

        html += '</div>';

        return html;
    }

    /**
     * Generate the language options HTML for subtitle language dropdown
     * @method generateLanguageOptions
     * @return {String} HTML string with option elements
     */
    function generateLanguageOptions() {
        var langOptions = '';
        var langMapping = FrameTrail.module('Database').subtitlesLangMapping;
        
        for (var lang in langMapping) {
            langOptions += '<option value="'+ lang +'">'+ langMapping[lang] +'</option>';
        }
        
        return langOptions;
    }

    /**
     * Create a new subtitle item element
     * @method createSubtitleItem
     * @return {HTMLElement} element for a new subtitle item
     */
    function createSubtitleItem() {
        var labels = getLabels();
        var langOptions = generateLanguageOptions();

        var languageSelect = '<select class="subtitlesTmpKeySetter">'
                           + '    <option value="" disabled selected style="display:none;">'+ labels['GenericLanguage'] +'</option>'
                           + langOptions
                           + '</select>';

        var _w = document.createElement('div');
        _w.innerHTML = '<span class="subtitlesItem">'+ languageSelect +'<input type="file" name="subtitles[]"><button class="subtitlesRemove" type="button">x</button><br></span>';
        return _w.firstElementChild;
    }

    /**
     * Attach subtitle event handlers to a form element
     * @method attachSubtitleHandlers
     * @param {HTMLElement|jQuery} formElement - The form element (or jQuery wrapper)
     */
    function attachSubtitleHandlers(formElement) {
        var el = (formElement instanceof Element) ? formElement : formElement[0];

        // Add new subtitle item
        el.querySelector('.subtitlesPlus').addEventListener('click', function() {
            var subtitleItem = createSubtitleItem();
            el.querySelector('.newSubtitlesContainer').append(subtitleItem);
        });

        // Remove subtitle item (delegated)
        el.querySelector('.newSubtitlesContainer').addEventListener('click', function(evt) {
            var btn = evt.target.closest('.subtitlesRemove');
            if (btn) { btn.parentElement.remove(); }
        });

        // Update file input name when language is selected (delegated)
        el.querySelector('.newSubtitlesContainer').addEventListener('change', function(evt) {
            var sel = evt.target.closest('.subtitlesTmpKeySetter');
            if (sel) {
                sel.parentElement.querySelector('input[type="file"]').name = 'subtitles[' + sel.value + ']';
            }
        });
    }

    /**
     * Populate existing subtitles in the edit dialog
     * @method populateExistingSubtitles
     * @param {HTMLElement|jQuery} formElement - The form element (or jQuery wrapper)
     * @param {Array} subtitles - Array of subtitle objects { src, srclang }
     */
    function populateExistingSubtitles(formElement, subtitles) {
        if (!subtitles || subtitles.length === 0) return;

        var el = (formElement instanceof Element) ? formElement : formElement[0];
        var langMapping = FrameTrail.module('Database').subtitlesLangMapping;
        var container = el.querySelector('.existingSubtitlesContainer');

        for (var i = 0; i < subtitles.length; i++) {
            var currentSubtitle = subtitles[i];
            var langName = langMapping[currentSubtitle.srclang] || currentSubtitle.srclang;

            var _iw = document.createElement('div');
            _iw.innerHTML = '<div class="existingSubtitlesItem"><span>'+ langName +'</span></div>';
            var existingItem = _iw.firstElementChild;

            var deleteButton = document.createElement('button');
            deleteButton.className = 'subtitlesDelete';
            deleteButton.type = 'button';
            deleteButton.dataset.lang = currentSubtitle.srclang;
            deleteButton.innerHTML = '<span class="icon-cancel"></span>';

            deleteButton.addEventListener('click', function(evt) {
                var lang = evt.currentTarget.dataset.lang;
                evt.currentTarget.closest('.existingSubtitlesItem').remove();
                el.querySelector('.subtitlesSettingsWrapper').insertAdjacentHTML('beforeend',
                    '<input type="hidden" name="SubtitlesToDelete[]" value="' + lang + '">' 
                );
            });

            existingItem.append(deleteButton);
            container.append(existingItem);
        }
    }

    // Export public interface
    return {

        // Time conversion utilities
        secondsToTimeString: secondsToTimeString,
        timeStringToSeconds: timeStringToSeconds,

        // Form generation
        generateSettingsRow: generateSettingsRow,
        generateVideoSourceSection: generateVideoSourceSection,

        // Subtitle handling
        attachSubtitleHandlers: attachSubtitleHandlers,
        populateExistingSubtitles: populateExistingSubtitles

    };

});
