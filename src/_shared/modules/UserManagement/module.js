/**
 * @module Shared
 */


/**
 * I contain all business logic about the UserManagement.
 *
 * I control both the UI as well as the data model for user management (registration, settings, administration) and the user login.
 *
 * @class UserManagement
 * @static
 */



FrameTrail.defineModule('UserManagement', function(FrameTrail){

	var labels = FrameTrail.module('Localization').labels;

	var userID                  = '',
		userRole				= '',
		userMail                = '',
		userRegistrationDate    = '',
		userColorCollection		= [],
		userSessionLifetime		= 0,
		userSessionTimeout		= null,
		isGuestMode				= false,
		userDialogCtrl			= null,

		userBoxCallback 		= null,
		userBoxCallbackCancel 	= null,

		domElement 	= $(	'<div class="UserBox">'
						+   '    <div class="userStatusMessage message">'
						+	'    </div>'
						+   '    <div class="userTabs">'
						+	'        <ul class="userTabMenu">'
						+	'            <li class="userTabSettingsMenu">'
						+   '                <a href="#UserTabSettings">'+ labels['UserMySettings'] +'</a>'
						+   '            </li>'
						+	'            <li class="userTabRegistrationMenu">'
						+   '                <a href="#UserTabRegistration">'+ labels['UserRegister'] +'</a>'
						+   '            </li>'
						+	'            <li class="userTabAdministrationMenu">'
						+   '                <a href="#UserTabAdministration">'+ labels['UserAdministration'] +'</a>'
						+   '            </li>'
						+	'        </ul>'
						+	'        <div id="UserTabSettings">'
						+   '             <form class="settingsForm" method="post">'
						+	'             	<p class="settingsFormStatus message"></p>'
						+   '             	<input type="text" name="name" id="SettingsForm_name" placeholder="'+ labels['UserName'] +'">'
						+   '             	<input type="text" name="mail" id="SettingsForm_mail" placeholder="'+ labels['UserMail'] +'"><br>'
						+	'				<div class="userColor"></div>'
						+   '             	<input type="password" name="passwd" id="SettingsForm_passwd" placeholder="'+ labels['UserNewPassword'] +'"><br>'
						+   '             	<br>'
						+   '             	<input type="hidden" name="a" value="userChange">'
						+	'             	<input type="hidden" name="userID" id="SettingsForm_userID" value="">'
						+   '             	<input type="submit" value="'+ labels['UserChangeMySettings'] +'">'
						+   '             </form>'
						+	'        </div>'
						+	'        <div id="UserTabRegistration">'
						+	'             <form class="registrationForm" method="post">'
						+	'             	<p class="registrationFormStatus message"></p>'
						+	'             	<input type="text" name="name" placeholder="'+ labels['UserName'] +'">'
						+	'             	<input type="text" name="mail" placeholder="'+ labels['UserMail'] +'">'
						+	'             	<input type="password" name="passwd" placeholder="'+ labels['UserPassword'] +'">'
						+	'             	<input type="hidden" name="a" value="userRegister">'
						+	'             	<input type="submit" value="'+ labels['UserRegister'] +'">'
						+	'             </form>'
						+	'        </div>'
						+	'        <div id="UserTabAdministration">'
						+	'             <p class="administrationFormStatus message"></p>'
						+   '             <button class="administrationFormRefresh">'+ labels['GenericRefresh'] +'</button>'
						+   '             <form class="administrationForm" method="post">'
                        +   '               <div class="custom-select" style="float: left; margin-top: 10px;">'
						+   '                   <select name="userID" id="user_change_user">'
						+  	'                       <option value="" selected disabled>'+ labels['UserSelect'] +'</option>'
			            +   '                   </select>'
                        +   '               </div>'
                        +   '               <div class="userDataContainer">'
						+   '             	    <input type="text" name="name" id="user_change_name" placeholder="'+ labels['UserName'] +'">'
						+   '             	    <input type="text" name="mail" id="user_change_mail" placeholder="'+ labels['UserMail'] +'">'
						+	'					<div id="user_change_colorContainer"></div>'
						+   '             	    <input type="password" name="passwd" id="user_change_passwd" placeholder="'+ labels['UserPassword'] +'">'
						+   '             	    <input type="radio" name="role" id="user_change_role_admin" value="admin">'
                        +   '                   <label for="user_change_role_admin">'+ labels['UserRoleAdmin'] +'</label>'
						+   '             	    <input type="radio" name="role" id="user_change_role_user" value="user">'
                        +   '                   <label for="user_change_role_user">'+ labels['UserRoleUser'] +'</label>'
						+   '             	    <input type="radio" name="active" id="user_change_active_1" value="1">'
                        +   '                   <label for="user_change_active_1">'+ labels['UserActive'] +'</label>'
						+   '             	    <input type="radio" name="active" id="user_change_active_0" value="0">'
                        +   '                   <label for="user_change_active_0">'+ labels['UserInactive'] +'</label>'
						+   '             	    <input type="hidden" name="a" value="userChange">'
						+   '             	    <input type="submit" value="'+ labels['UserChangeSettings'] +'">'
                        +   '               </div>'
						+   '             </form>'
						+	'        </div>'
                        +   '    </div>'
						+	'</div>'),

		loginBox = $(	'<div class="userLoginOverlay ui-blocking-overlay">'
					+   '    <div class="loginBox ui-overlay-box">'
					+   '        <div class="boxTitle">'
					+   '            <span class="loginTabButton loginBoxTabButton">'+ labels['UserLogin'] +'</span>'
					+   '            <span class="loginBoxOrDivider" style="color: #888; font-size: 17px;">'+ labels['UserDividerOr'] +'</span>'
					+   '            <span class="createAccountTabButton loginBoxTabButton inactive">'+ labels['UserCreateAccount'] +'</span>'
					+   '            <span class="loginBoxOrDivider" style="color: #888; font-size: 17px;">'+ labels['UserDividerOr'] +'</span>'
					+   '            <span class="editAsGuestTabButton loginBoxTabButton inactive">'+ labels['UserEditAsGuest'] +'</span>'
					+   '        </div>'
					+	'        <div class="userTabLogin">'
					+	'             <form class="loginForm" method="post">'
					+	'             	<p class="loginFormStatus message"></p>'
					+	'             	<input type="text" name="mail" placeholder="'+ labels['UserMail'] +'">'
					+	'             	<input type="password" name="passwd" placeholder="'+ labels['UserPassword'] +'">'
					+	'             	<input type="hidden" name="a" value="userLogin">'
					+	'             	<input type="submit" value="Login">'
					+	'             	<button type="button" class="loginBoxCancelButton">Cancel</button>'
					+	'             </form>'
					+	'        </div>'
					+	'        <div class="userTabRegister">'
					+	'             <form class="userRegistrationForm" method="post">'
					+	'             	<p class="userRegistrationFormStatus" class="message"></p>'
					+	'             	<input type="text" name="name" placeholder="'+ labels['UserName'] +'">'
					+	'             	<input type="text" name="mail" placeholder="'+ labels['UserMail'] +'">'
					+	'             	<input type="password" name="passwd" placeholder="'+ labels['UserPassword'] +'">'
					+	'             	<input type="hidden" name="a" value="userRegister">'
					+	'             	<input type="submit" value="'+ labels['UserCreateAccount'] +'">'
					+	'             	<button type="button" class="loginBoxCancelButton">'+ labels['GenericCancel'] +'</button>'
					+	'             </form>'
					+	'        </div>'
					+	'        <div class="userTabGuest">'
					+	'             <div class="guestEditHint">'+ labels['UserGuestEditNote'] +'</div>'
					+	'             <input type="text" class="guestNameInput" placeholder="'+ labels['UserGuestName'] +'">'
					+	'             <button type="button" class="guestContinueButton">'+ labels['UserEditAsGuest'] +'</button>'
					+	'             <button type="button" class="loginBoxCancelButton">'+ labels['GenericCancel'] +'</button>'
					+	'        </div>'
	                +   '    </div>'
					+	'</div>');


	/* Administration Box */

	domElement.find('.userTabs').tabs({
        heightStyle: "fill"
    });


	domElement.find('.registrationForm').on('submit', function(e) {
		e.preventDefault();
		var _form = this;
		fetch('_server/ajaxServer.php', { method: 'POST', body: new FormData(_form) })
		.then(function(r) { return r.json(); })
		.then(function(response) {
			switch(response.code){
				case 0:
					domElement.find('.registrationFormStatus').removeClass('error').addClass('active success').text(labels['MessageSuccessfullyRegistered']);
					break;
				case 1:
					domElement.find('.registrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorEmptyFieldsMail']);
					break;
				case 2:
					domElement.find('.registrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorMailExists']);
					break;
				case 3:
					domElement.find('.registrationFormStatus').removeClass('success error').addClass('active').text(labels['MessageRegisteredActivationPending']);
					break;
			}
		});
	});


	domElement.find('.settingsForm').on('submit', function(e) {
		e.preventDefault();
		var _form = this;
		fetch('_server/ajaxServer.php', { method: 'POST', body: new FormData(_form) })
		.then(function(r) { return r.json(); })
		.then(function(response) {
			switch(response.code){
				case 0:
					FrameTrail.module('Database').users[FrameTrail.module('UserManagement').userID].color = response.response.color;
					FrameTrail.changeState('username', response.response.name);
					FrameTrail.changeState('userColor', response.response.color);
					domElement.find('.settingsFormStatus').removeClass('error').addClass('active success').text(labels['MessageSettingsChanged']);
					break;
				case 1:
					domElement.find('.settingsFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserDBNotFound']);
					break;
				case 2:
					domElement.find('.settingsFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserChanged']);
					break;
				case 3:
					domElement.find('.settingsFormStatus').removeClass('success error').addClass('active').text(labels['MessageSettingsSavedExceptMail']);
					break;
				case 4:
					domElement.find('.settingsFormStatus').removeClass('success').addClass('active error').text(labels['ErrorNotLoggedInAnymore']);
					break;
				case 5:
					domElement.find('.settingsFormStatus').removeClass('success').addClass('active error').text(labels['ErrorAccountDeactivated']);
					break;
				case 6:
					domElement.find('.settingsFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserNotFound']);
					break;
			}
		});
	});


	var refreshAdministrationForm = function(){


		domElement.find('.administrationForm')[0].reset();
        domElement.find('.userDataContainer').hide();


		fetch('_server/ajaxServer.php', {
			method: 'POST',
			body: new URLSearchParams({ a: 'userGet' })
		})
		.then(function(r) { return r.json(); })
		.then(function(data) {

			if (!data || !data.response) {
				console.error(labels['ErrorNoUserFile']);
				return;
			}

			var allUsers = data.response.user;

			domElement.find("#user_change_user").html('<option value="" selected disabled>'+ labels['UserSelect'] +'</option>');

			for (var id in allUsers) {
				domElement.find("#user_change_user").append('<option value="' + id + '">' + allUsers[id].name + '</option>');
			}

		});

	}

	// Bind change event once on the native select element
	domElement.find("#user_change_user").on('change', function(evt){

		var selectedUserID = $(this).val();
		fetch('_server/ajaxServer.php', {
			method: 'POST',
			body: new URLSearchParams({ a: 'userGet', userID: selectedUserID })
		})
		.then(function(r) { return r.json(); })
		.then(function(ret) {
			domElement.find("#user_change_name").val(ret["response"]["name"]);
			domElement.find("#user_change_mail").val(ret["response"]["mail"]);
			domElement.find("#user_change_color").val(ret["response"]["color"]);
			domElement.find("#user_change_passwd").val("");
			domElement.find(".administrationForm input[name='role']").prop("checked",false).removeAttr("checked");
			domElement.find(".administrationForm input#user_change_role_"+ret["response"]["role"]).prop("checked",true).attr("checked","checked");
			domElement.find(".administrationForm input[name='active']").prop("checked",false).removeAttr("checked");
			domElement.find(".administrationForm input#user_change_active_"+ret["response"]["active"]).prop("checked",true).attr("checked","checked");
			getUserColorCollection(function() {
				renderUserColorCollectionForm(ret["response"]["color"],"#user_change_colorContainer");
			});
			domElement.find('.userDataContainer').show();
		});

	});


	domElement.find('.administrationFormRefresh').click(refreshAdministrationForm);

	if (FrameTrail.module('RouteNavigation').environment.server &&
        !FrameTrail.getState('videoElement') &&
        !FrameTrail.getState('videoSource') &&
        !FrameTrail.getState('users')) {
        refreshAdministrationForm();
    }


	domElement.find(".administrationForm").on('submit', function(e) {
		e.preventDefault();
		var _form = this;
		fetch('_server/ajaxServer.php', { method: 'POST', body: new FormData(_form) })
		.then(function(r) { return r.json(); })
		.then(function(response) {
			// TODO: Update client userData Object if Admin edited himself via this view instead of "Settings" Tab
			refreshAdministrationForm();
			switch(response.code){
				case 0:
					domElement.find('.administrationFormStatus').removeClass('error').addClass('active success').text(labels['MessageSettingsChanged']);
					break;
				case 1:
					domElement.find('.administrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserDBNotFound']);
					break;
				case 2:
					domElement.find('.administrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserNotAdmin']);
					break;
				case 3:
					domElement.find('.administrationFormStatus').removeClass('error success').addClass('active').text(labels['MessageSettingsSavedExceptMail']);
					break;
				case 4:
					domElement.find('.administrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorNotLoggedInAnymore']);
					break;
				case 5:
					domElement.find('.administrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorAccountDeactivated']);
					break;
				case 6:
					domElement.find('.administrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserNotFound']);
					break;
			}
		});
	});

	function renderUserColorCollectionForm(selectedColor, targetElement) {
		var elem = $("<div class='userColorCollectionContainer'><input type='hidden' name='color' value='"+ selectedColor +"'>"+ labels['UserColor'] +":<div class='userColorCollection'></div></div>");
		for (var c in userColorCollection) {
			elem.find(".userColorCollection").append("<div class='userColorCollectionItem"+((userColorCollection[c] == selectedColor) ? " selected" : "")+"' style='background-color:#"+userColorCollection[c]+"' data-color='"+userColorCollection[c]+"'></div>");
		}
		elem.on("click", ".userColorCollectionItem", function() {
			elem.find(".userColorCollectionItem.selected").removeClass("selected");
			$(this).addClass("selected");
			elem.find("input[name='color']").val($(this).data("color"));
		});

		$(targetElement).html(elem);
	}

	function getUserColorCollection(callback) {
		// Default color collection as fallback (matches ajaxServer.php setupInit)
		var defaultColors = ["597081", "339966", "16a09c", "cd4436", "0073a6", "8b5180", "999933", "CC3399", "7f8c8d", "ae764d", "cf910d", "b85e02"];
		
		// First, try to get config from Database module if it's already loaded
		try {
			var dbConfig = FrameTrail.module('Database').config;
			if (dbConfig && dbConfig.userColorCollection && Array.isArray(dbConfig.userColorCollection)) {
				userColorCollection = dbConfig.userColorCollection;
				if (typeof(callback) == "function") {
					callback.call();
				}
				return;
			}
		} catch(e) {
			// Database module not available or config not loaded yet
		}
		
		// Fallback: load config.json as text to prevent XML parsing errors,
		// then manually parse JSON.
		fetch('_data/config.json', { cache: 'no-cache' })
			.then(function(r) { return r.text(); })
			.then(function(textData) {
				try {
					var data = JSON.parse(textData);
					userColorCollection = data["userColorCollection"] || defaultColors;
				} catch(e) {
					// If JSON parsing fails, use default colors
					userColorCollection = defaultColors;
				}
				if (typeof(callback) == "function") {
					callback.call();
				}
			})
			.catch(function() {
				// If config.json doesn't exist or fails to load, use default colors
				userColorCollection = defaultColors;
				if (typeof(callback) == "function") {
					callback.call();
				}
			});

	}

	/* Login Box */

    loginBox.find('.guestContinueButton').click(function() {
    	var name = loginBox.find('.guestNameInput').val().trim();
    	if (!name) {
    		loginBox.find('.guestNameInput').focus();
    		return;
    	}
    	loginAsGuest(name);
    });

    loginBox.find('.guestNameInput').on('keypress', function(e) {
    	if (e.which === 13) { loginBox.find('.guestContinueButton').click(); }
    });

    loginBox.find('.loginBoxCancelButton').click(function() {
    	if(typeof userBoxCallbackCancel === 'function'){
			userBoxCallbackCancel.call();
		}
		closeLoginBox();
    });

    loginBox.find('.loginBoxTabButton').click(function(evt) {

    	loginBox.find('.loginBoxTabButton').removeClass('inactive');

    	if ( $(this).hasClass('loginTabButton') ) {

    		loginBox.find('.createAccountTabButton').addClass('inactive');
    		loginBox.find('.editAsGuestTabButton').addClass('inactive');
    		loginBox.find('.userTabRegister').hide();
    		loginBox.find('.userTabGuest').hide();
    		loginBox.find('.userTabLogin').show();

    	} else if ( $(this).hasClass('createAccountTabButton') ) {

    		loginBox.find('.loginTabButton').addClass('inactive');
    		loginBox.find('.editAsGuestTabButton').addClass('inactive');
    		loginBox.find('.userTabLogin').hide();
    		loginBox.find('.userTabGuest').hide();
    		loginBox.find('.userTabRegister').show();

    	} else {

    		// editAsGuestTabButton
    		loginBox.find('.loginTabButton').addClass('inactive');
    		loginBox.find('.createAccountTabButton').addClass('inactive');
    		loginBox.find('.userTabLogin').hide();
    		loginBox.find('.userTabRegister').hide();
    		loginBox.find('.userTabGuest').show();

    	}

    });

    loginBox.find('.loginForm').on('submit', function(e) {
		e.preventDefault();
		var _form = this;
		fetch('_server/ajaxServer.php', { method: 'POST', body: new FormData(_form) })
		.then(function(r) { return r.json(); })
		.then(function(response) {
			//console.log(response);
			switch(response.code){
				case 0:
					userSessionLifetime = parseInt(response.session_lifetime);
					login(response.userdata);
					FrameTrail.triggerEvent('userAction', {
						action: 'UserLogin',
						userID: response.userdata.id,
						userName: response.userdata.name,
						userRole: response.userdata.role,
						userMail: response.userdata.mail
					});
					loginBox.find('.loginFormStatus').removeClass('active error success').text('');
					updateView(true);
					if(typeof userBoxCallback === 'function'){
						userBoxCallback.call();
						closeLoginBox();
					}
					break;
				case 1:
					loginBox.find('.loginFormStatus').removeClass('success').addClass('active error').text(labels['ErrorEmptyFields']);
					break;
				case 2:
					loginBox.find('.loginFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserNotFound']);
					break;
				case 3:
					loginBox.find('.loginFormStatus').removeClass('success').addClass('active error').text(labels['ErrorWrongPassword']);
					break;
				case 4:
					loginBox.find('.loginFormStatus').removeClass('success').addClass('active error').text(labels['ErrorUserDBNotFound']);
					break;
				case 5:
					loginBox.find('.loginFormStatus').removeClass('success').addClass('active error').text(labels['ErrorNotActivated']);
					break;
			}
		});
	});


	loginBox.find('.userRegistrationForm').on('submit', function(e) {
		e.preventDefault();
		var _form = this;
		fetch('_server/ajaxServer.php', { method: 'POST', body: new FormData(_form) })
		.then(function(r) { return r.json(); })
		.then(function(response) {
			switch(response.code){
				case 0:
					loginBox.find('.loginFormStatus').removeClass('error').addClass('active success').text(labels['MessageSuccessfullyRegistered']);
					loginBox.find('.loginTabButton').click();
					FrameTrail.module('InterfaceModal').showStatusMessage(labels['MessageUpdatingClientData']);
					FrameTrail.module('Database').loadData(function() {
						FrameTrail.module('InterfaceModal').showStatusMessage(labels['MessageClientDataUpdated']);
						FrameTrail.module('InterfaceModal').hideMessage(800);
					}, function() {
						FrameTrail.module('InterfaceModal').showErrorMessage(labels['ErrorUpdatingClientData']);
					});
					break;
				case 1:
					loginBox.find('.userRegistrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorEmptyFieldsMail']);
					break;
				case 2:
					loginBox.find('.userRegistrationFormStatus').removeClass('success').addClass('active error').text(labels['ErrorMailExists']);
					break;
				case 3:
					loginBox.find('.userRegistrationFormStatus').removeClass('error').addClass('active success').text(labels['MessageRegisteredActivationPending']);
					break;
			}
		});
	});

	$(FrameTrail.getState('target')).append(loginBox);




	/**
	 * Sometimes a routine should only execute, if we can ensure the user is logged in at this point.
	 *
	 * I serve this purpose, by checking wether the user has already logged in, and if not provide him the chance
	 * to login (or even create an account first).
	 *
	 * After the user has logged in I call the callback (the routine which shall execute only with a logged-in user).
	 *
	 * If the user aborted the offer to login, an optional cancelCallback can be called.
	 *
	 * @method ensureAuthenticated
	 * @param {Function} callback
	 * @param {Function} callbackCancel (optional)
	 * @param {Boolean} disallowCancel (optional)
	 */
	function ensureAuthenticated(callback, callbackCancel, disallowCancel){

		isLoggedIn(function(loginStatus) {

			if (loginStatus) {

				callback.call();

			} else {

				userBoxCallback = callback;
				userBoxCallbackCancel = callbackCancel;
				showLoginBox(disallowCancel);

			}

		});

	}


	/**
	 * I check wether the user has logged in, and call the callback with a boolean to indicate this.
	 *
	 * @method isLoggedIn
	 * @param {Function} callback
	 */
	function isLoggedIn(callback) {

		var storageMode = FrameTrail.getState('storageMode');

		// Guest mode is set explicitly via loginAsGuest() — session-only, cleared on reload.
		// Works for local, download, AND server mode (when editing as guest on a server instance).
		if (isGuestMode) {
			window.setTimeout(function() {
				callback.call(window, true);
			}, 2);
			return;
		}

		// In local/download mode without guest mode active, user is not yet identified.
		// Also applies when storageMode is not yet set but shorthand API options
		// indicate that the Download adapter will be used (videoElement / videoSource).
		if (storageMode === 'local' || storageMode === 'download' ||
		    FrameTrail.getState('videoElement') || FrameTrail.getState('videoSource')) {
			window.setTimeout(function() {
				callback.call(window, false);
			}, 2);
			return;
		}

		if (!FrameTrail.module('RouteNavigation').environment.server || FrameTrail.getState('users')) {
            window.setTimeout(function() {
            	FrameTrail.changeState({
					editMode: false,
					loggedIn: false,
					username: '',
					userColor: ''
				});
	            callback.call(window, false);
            }, 2);

            return;
        }

		fetch('_server/ajaxServer.php', {
			method: 'POST',
			body: new URLSearchParams({ a: 'userCheckLogin' })
		})
		.then(function(r) { return r.json(); })
		.then(function(response) {
			switch(response.code){

				case 0:
					logout();
					callback.call(window, false);
					break;

				case 1:
					userSessionLifetime = parseInt(response.session_lifetime);
					login(response.response);
					callback.call(window, true);
					break;

				case 2:
					console.error(labels['ErrorNoUserFile']);
					FrameTrail.changeState({
						editMode: false,
						loggedIn: false,
						username: '',
						userColor: ''
					});
					callback.call(window, false);
					break;

				case 3:
					console.error(labels['ErrorNotActivated']);
					break;

				case 4:
					console.error(labels['ErrorWrongRole']);
					break;

			}

		})
		.catch(function() {
			FrameTrail.changeState({
				editMode: false,
				loggedIn: false,
				username: '',
				userColor: ''
			});
			callback.call(window, false);
		});

	}


	/**
	 * I am called to update my local and gloabl state __after__ the server has created a login session.
	 *
	 * @method login
	 * @param {} userData
	 * @private
	 */
	function login(userData) {

		userID    = userData.id;
		userRole  = userData.role;
		userMail  = userData.mail;
		userRegistrationDate = userData.registrationDate;

		resetSessionTimeout();

		FrameTrail.changeState('username', userData.name);
		FrameTrail.changeState('userColor', userData.color);
		FrameTrail.changeState('loggedIn', true);

		$(FrameTrail.getState('target')).addClass('loggedIn');

		updateView(true);

	}


	/**
	 * I log in as a guest (name only, no server session).
	 * Sets isGuestMode and stores the name in localStorage for pre-fill convenience.
	 *
	 * @method loginAsGuest
	 * @param {String} name
	 * @private
	 */
	function loginAsGuest(name) {

		isGuestMode = true;
		userID   = 'guest_' + Date.now();
		userRole = 'admin';
		userMail = '';
		userRegistrationDate = '';

		localStorage.setItem('frametrail_guest_user', JSON.stringify({ name: name }));

		FrameTrail.changeState('username', name);
		FrameTrail.changeState('userColor', '#666666');
		FrameTrail.changeState('loggedIn', true);

		$(FrameTrail.getState('target')).addClass('loggedIn');

		// Push user info into the active adapter so adapter.userInfo-dependent code works
		var _adapter = FrameTrail.module('StorageManager').getAdapter();
		if (_adapter && _adapter.setUserInfo) {
			_adapter.setUserInfo({ id: userID, name: name, role: 'admin', color: '#666666', mail: '' });
		}

		updateView(true);

		var _callback = userBoxCallback;
		closeLoginBox();

		if (typeof _callback === 'function') {
			_callback.call();
		}

	}


	/**
	 * I am called to close the login session and update my local and global state.
	 *
	 * @method logout
	 */
	function logout() {

		// Guest / local / download logout: clear in-memory state, no server call needed.
		if (isGuestMode || FrameTrail.getState('storageMode') !== 'server') {
			isGuestMode = false;
			userID = '';
			userRole = '';
			userMail = '';
			userRegistrationDate = '';
			FrameTrail.changeState({
				editMode: false,
				loggedIn: false,
				username: '',
				userColor: ''
			});
			$(FrameTrail.getState('target')).removeClass('loggedIn');
			updateView(false);
			return;
		}

		fetch('_server/ajaxServer.php', {
			method: 'POST',
			body: new URLSearchParams({ a: 'userLogout' })
		})
		.then(function(r) { return r.json(); })
		.then(function(data) {

			if (userID != '') {
				var loggedOutDialog = $('<div class="loggedOutDialog">'
                                  + '    <div class="message success active">'+ labels['MessageUserLoggedOut'] +'</div>'
                                  + '</div>');

	                var loggedOutDialogCtrl = FrameTrailDialog({
						resizable: false,
						modal: true,
						content: loggedOutDialog,
						close: function() {
							try {
								if (TogetherJS && TogetherJS.running) {
	                                var elementFinder = TogetherJS.require("elementFinder");
	                                var location = elementFinder.elementLocation(loggedOutDialog[0]);
	                                TogetherJS.send({
	                                    type: "simulate-dialog-close",
	                                    element: location
	                                });
	                          	}
	                        } catch (e) {}

							FrameTrail.triggerEvent('userAction', {
								action: 'UserLogout'
							});

							if (FrameTrail.module('Database').config.alwaysForceLogin) {
								FrameTrail.module('InterfaceModal').hideMessage();
								FrameTrail.module('UserManagement').ensureAuthenticated(function() {}, function() {}, true);
							}

							loggedOutDialogCtrl.destroy();
						},
						buttons: {
							"OK": function() {
								loggedOutDialogCtrl.close();
							}
						}
	                });
				}

				userID    = '';
				userRole  = '';
				userMail  = '';
				userRegistrationDate = '';

				FrameTrail.changeState({
					editMode: false,
					loggedIn: false,
					username: '',
					userColor: ''
				});

				$(FrameTrail.getState('target')).removeClass('loggedIn');

				updateView(false);

				FrameTrail.triggerEvent('userAction', {
					action: 'UserLogout'
				});

		});

	}


	/**
	 * The UI of the UserManagement has to be updated, when the loginStatus changes.
	 *
	 * I check wether the user is an admin or a normal user, and show and hide the respective tabs (Settings and Administration) accordingly.
	 *
	 * @method updateView
	 * @param {Boolean} loginStatus
	 * @private
	 */
	function updateView(loginStatus){

		if (loginStatus){

			//domElement.find('#UserStatusMessage').addClass('active').text('Hello! Your are logged in, '+ FrameTrail.getState('username') +'.');

			domElement.find('.userTabSettingsMenu').show();
			updateSettings();

			if (userRole === 'admin'){
				domElement.find('.userTabAdministrationMenu').show();
				$(FrameTrail.getState('target')).addClass('frametrail-admin');
			}


		} else {

			domElement.find('.userTabSettingsMenu').hide();
			domElement.find('.userTabAdministrationMenu').hide();
			$(FrameTrail.getState('target')).removeClass('frametrail-admin');

		}


	}


	/**
	 * I update the UI elements of the tab Settings
	 * @method updateSettings
	 * @private
	 */
	function updateSettings() {

		domElement.find('#SettingsForm_name')[0].value   = FrameTrail.getState('username');
		domElement.find('#SettingsForm_mail')[0].value   = userMail;
		//domElement.find('#SettingsForm_color')[0].value  = userColor;
		domElement.find('#SettingsForm_passwd')[0].value = '';
		domElement.find('#SettingsForm_userID')[0].value = userID;

	}


	/**
	 * I open the login box.
	 * The UI is a single DOM element
	 *
	 * @method showLoginBox
	 * @param {Boolean} disallowCancel
	 */
	function showLoginBox(disallowCancel) {

		if (disallowCancel) {
			loginBox.find('.loginBoxCancelButton').hide();
		} else {
			loginBox.find('.loginBoxCancelButton').show();
		}

		loginBox.find('.message').removeClass('active error').text('');
		loginBox.find('.loginForm')[0].reset();
		loginBox.find('.userRegistrationForm')[0].reset();

		// Pre-fill guest name from localStorage if available
		var savedGuest = localStorage.getItem('frametrail_guest_user');
		if (savedGuest) {
			try {
				var guestData = JSON.parse(savedGuest);
				if (guestData && guestData.name) {
					loginBox.find('.guestNameInput').val(guestData.name);
				}
			} catch(e) {}
		}

		// In non-server mode, show only the Edit as Guest tab
		var storageMode = FrameTrail.getState('storageMode');
		if (storageMode !== 'server') {
			loginBox.find('.loginTabButton').hide();
			loginBox.find('.createAccountTabButton').hide();
			loginBox.find('.loginBoxOrDivider').hide();
			loginBox.find('.editAsGuestTabButton').click();
		} else {
			loginBox.find('.loginTabButton').show();
			loginBox.find('.createAccountTabButton').show();
			loginBox.find('.loginBoxOrDivider').show();
			// Reset to login tab when showing in server mode
			loginBox.find('.loginTabButton').click();
		}

		loginBox.fadeIn();

	}


	/**
	 * I close the login box.
	 *
	 * @method closeLoginBox
	 */
	function closeLoginBox() {

		userBoxCallback = null;
		userBoxCallbackCancel = null;

		loginBox.fadeOut();

	}


	/**
	 * I open the user administration dialog.
	 * The UI is a single DOM element, which is displayed via jQuery UI Dialog
	 *
	 * @method showAdministrationBox
	 */
	function showAdministrationBox() {

		ensureAuthenticated(function() {

			userDialogCtrl = FrameTrailDialog({
				title: labels['UserManagement'],
				content: domElement,
				modal: true,
				width: 600,
				height: 460,
		        open: function() {
		            updateView(true);
		            domElement.find('.userTabs').tabs('refresh');
					getUserColorCollection(function() {
						renderUserColorCollectionForm(FrameTrail.getState('userColor'),".userColor")
					});
		        },
		        close: function() {
					userDialogCtrl.destroy();
					userDialogCtrl = null;
				}
			});

		});

	}


	/**
	 * I close the user administration dialog (jQuery UI Dialog).
	 *
	 * @method closeAdministrationBox
	 * @return
	 */
	function closeAdministrationBox() {

		if (userDialogCtrl) userDialogCtrl.close();

	}


	/**
	 * I start the (PHP) session timeout counter.
	 *
	 * @method startSessionTimeout
	 * @return
	 */
	function startSessionTimeout() {

		// session lifetime minus 30 seconds
		var timeoutDuration = (userSessionLifetime-30) * 1000;
		//console.log('Starting Session Timeout at: ' + Math.floor( (userSessionLifetime-30) / 60 ) + ' minutes');
		userSessionTimeout = setTimeout(function() {
			// Renew Session
			//console.log('Renewing Session ...');
			isLoggedIn(function(){});
		}, timeoutDuration);

	}


	/**
	 * I reset the (PHP) session timeout counter.
	 *
	 * @method resetSessionTimeout
	 * @return
	 */
	function resetSessionTimeout() {

		clearTimeout(userSessionTimeout);
		startSessionTimeout();

	}


	// Init the user model
	isLoggedIn(function(){});


	return {

		showLoginBox: 	        showLoginBox,
		closeLoginBox: 	        closeLoginBox,
		showAdministrationBox: 	showAdministrationBox,
		closeAdministrationBox: closeAdministrationBox,

		isLoggedIn: 			isLoggedIn,
		ensureAuthenticated: 	ensureAuthenticated,
		logout: 				logout,
		isGuestMode: 			function() { return isGuestMode; },

		/**
		 * The current userID or an empty String.
		 * @attribute userID
		 */
		get userID()    { return userID.toString()   },
		/**
		 * The users mail adress as a String.
		 * @attribute userMail
		 */
		get userMail()  { return userMail            },
		/**
		 * The users role, which is either 'admin' or 'user', or – when not logged in – an empty String.
		 * @attribute userRole
		 */
		get userRole()  { return userRole            },
		/**
		 * The users registration Date, which is a Number (milliseconds since 01-01-1970)
		 * @attribute userRegistrationDate
		 */
		get userRegistrationDate() { return userRegistrationDate }

	};


});
