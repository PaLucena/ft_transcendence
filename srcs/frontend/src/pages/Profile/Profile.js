import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from "../../scripts/utils/customAlert.js";
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';
import { staticComponentsRenderer } from '../../scripts/utils/StaticComponentsRenderer.js';
import { closeGlobalSockets } from '../../scripts/utils/globalSocketManager.js';

export class Profile extends Component {
	constructor(params = {}) {
		super('/pages/Profile/profile.html', params);
		this.qrModalInstance = null;
	}

	destroy() {
		this.removeAllEventListeners(this.params);
    }

	init() {
		this.displayUserInfo(this.params.username);
		this.setUpEventListeners();
		this.disable2fa();
		setTimeout(() => languageSelector.updateLanguage(), 0);
	}

	async displayUserInfo(username) {
		try {
			const fetchUrl = username ? `/api/get_other_user_data/${username}` : "/api/get_user_data/";
			const myUsername = await this.getOwnName();
			let responseData = null;

			const response = await fetch(fetchUrl, {
				method: "GET",
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			await handleResponse(response, data => {
				responseData = data;

				this.displayUserStats(data["username"]);

				if (myUsername === data["username"]) {


					const editPlaceholder = document.getElementById("editPlaceholder");
					if (editPlaceholder)
						editPlaceholder.innerHTML = `<button id="editBtn" class="btn btn-green text-white col-12" data-i18n='edit-profile'></button>`;

					const logoutPlaceholder = document.getElementById("logoutPlaceholder");
					if (logoutPlaceholder)
						logoutPlaceholder.innerHTML = `<button id="logoutBtn" class="btn btn-outline-dark col-12" data-i18n='logout'></button>`;

					setTimeout(() => languageSelector.updateLanguage(), 0);
					this.editUserBtn(data);
					this.setUpLogout();
				}
				else {
					this.renderChatBtn(data["username"]);

					const ownStatsBtn = document.getElementById("ownStatsBtn");
					if (ownStatsBtn)
						ownStatsBtn.innerHTML = `${data['username']} <span data-i18n='stats'></span>`;

					if (!data['friendship']) {
						const statsPlaceholder = document.getElementById('statsPlaceholder');
						if (statsPlaceholder)
							statsPlaceholder.innerHTML = `<div class="h-100 w-100 d-flex justify-content-center align-items-center"><h1><span data-i18n='friend'></span>n't</h1></div>`;
					}

					if (data['friendship'] && data['matches_in_common']) {
						const statsSelector = document.getElementById('statsSelector');
						if (statsSelector)
							statsSelector.innerHTML += `<button id="friendshipStatsBtn" class="btn btn-outline-dark position-relative" data-i18n="our-stats"></button>`;

						const friendName = document.getElementById('friendName');
						if (friendName)
							friendName.innerHTML = data['username'];

						this.displayFriendshipStats(data['username']);
						this.selectStats();
					}
				}

				const profileContainer =document.getElementById('rootProfile');
				if (profileContainer) {
					const profilePhoto = profileContainer.querySelector('#profile_photo');
					if (profilePhoto && data.avatar)
						profilePhoto.style.backgroundImage = `url(${data.avatar || '/assets/images/default_avatar.jpg'})`;
				}

				const usernamePlaceholder = document.getElementById("usernamePlaceholder");
				if (usernamePlaceholder)
					usernamePlaceholder.innerHTML = data["username"];

				const friendsNbPlaceholder = document.getElementById("friendsNbPlaceholder");
				if (friendsNbPlaceholder)
					friendsNbPlaceholder.innerHTML = data["number_of_friends"];

				if (data["number_of_friends"] == 1) {
					const friendsText = document.getElementById("friendsText");
					if (friendsText)
						friendsText.setAttribute("data-i18n", "friend");
				}

				setTimeout(() => languageSelector.updateLanguage(), 0);
			});

			if (myUsername === responseData['username'] && responseData['is_42']) {
				const form = document.getElementById('editForm');

				if (form) {
					const inputIds = ["new_username", "old_password", "new_password", "confirm_password"];

					inputIds.forEach(id => {
						const inputElement = form.querySelector(`#${id}`);

						if (inputElement) {
							const containerDiv = inputElement.closest('.col-9.form-floating');

							if (containerDiv) {
								containerDiv.remove();
							}
						}
					});
				}

				const twoFaButtons = document.getElementById('2faButtonPlaceholder');
				if (twoFaButtons)
					twoFaButtons.remove();
			}

		} catch (error) {
			if (error.errorCode === 404) {
				const profileContainer = document.getElementById("rootProfile");
				if (profileContainer) {
					document.getElementById("rootProfile").style.justifyContent = 'center';
					document.getElementById("rootProfile").style.alignItems = 'center';
					document.getElementById("rootProfile").innerHTML = '<p class="display-1" data-i18n="user-not-found"><p>';
				}

				setTimeout(() => languageSelector.updateLanguage(), 0);
			} else {
				console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
			}
		}
	}

	displayUserStats(username) {
		fetch(`/api/player_statistics/${username}/`, {
			method: "GET",
			headers: {'Content-Type': 'application/json'},
			credentials: 'include'
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json();
		})
		.then(data => {
			let winRate = (data['wins'] * 100 / data['total_matches']) || 0;
			winRate = winRate < 6 ? Math.round(winRate) : Math.round(winRate * 10) / 10;
			data['average_score'] = Math.round(data['average_score'] * 100) / 100;

			const winRateBar = document.getElementById('winRateBar');
			if (winRateBar) {
				winRateBar.innerHTML = `${winRate}%`;
				winRateBar.style.width = `${winRate}%`;
			}

			if (data["match_total_time"] == -1)
				data["match_total_time"] = 0;

			const liStats = document.querySelectorAll('#ownStatsList li');

			liStats.forEach(liStat => {
				let currStat = liStat.querySelectorAll('div')[1];
				if (currStat)
					currStat.innerHTML = data[currStat.id];
			});
		})
		.catch(error => {
			console.error("Error(displayUserStats):", error);
		})
	}

	displayFriendshipStats(username) {
		fetch(`/api/player_comparison/${username}/`, {
			method: "GET",
			headers: {'Content-Type': 'application/json'},
			credentials: 'include'
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json();
		})
		.then(data => {
			const friendshipWinRateBar = document.getElementById('friendshipWinRateBar');
			if (friendshipWinRateBar) {
				friendshipWinRateBar.innerHTML = data['player1_win_percentage'];
				friendshipWinRateBar.style.width = `${data['player1_win_percentage']}%`;
			}

			const liStats = document.querySelectorAll('#friendshipStatsList li');

			liStats.forEach(liStat => {
				let currStat = liStat.querySelectorAll('div')[1];

				if (currStat)
					currStat.innerHTML = data[currStat.id];
			});
		})
		.catch(error => {
			console.erro("Error(displayFriendshipStats):", error);
		})
	}

	renderChatBtn(username) {
		const chatBtnPlaceholder = document.getElementById('chatBtnPlaceholder');
		if (chatBtnPlaceholder)
			chatBtnPlaceholder.innerHTML = '<button id="chatBtn" class="btn btn-green profile-chat-btn d-flex justify-content-center align-items-center ml-3 rounded-circle square"><i class="fa-regular fa-comment-dots"></i></button>';

		const chatBtn = document.getElementById("chatBtn");
		if (chatBtn) {
			this.addEventListener(chatBtn, "click", async () => {
				try {
					const response = await fetch(`/api/chat/user/${username}/`, {
						method: 'GET',
						headers: {
							"Content-Type": "application/json",
						},
						credentials: 'include',
					});

					await handleResponse(response, data => {
						const chatModalInstance = staticComponentsRenderer.getComponentInstance('ChatModal');
						if (chatModalInstance) {
							const messagesModal = document.getElementById('messages_modal');

							if (messagesModal) {
								const bootstrapModal = new bootstrap.Modal(messagesModal);
								bootstrapModal.show();
								chatModalInstance.chatLoader.initChatroom(data.chatroom_name);
							} else {
								console.error("messages_modal not found.");
							}

						} else {
							console.error("ChatModal instance is not initialized");
						}

					});

				} catch (error) {
					console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
				}
			});
		}
	}

	async getOwnName() {
		try {
			const response = await fetch('/api/get_user_data/', {
				method: "GET",
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			let responseUsername = null;

			await handleResponse(response, data => {
				responseUsername = data["username"];

			});
			return responseUsername;
		} catch (error) {
			console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
		}
	}

	editUserBtn() {
		const editBtn = document.getElementById("editBtn");

		if (editBtn) {
			this.addEventListener(editBtn, "click", () => {
				document.getElementById("userInfo").style.display = "none";
				document.getElementById("userEdit").style.display = "block";

				this.startPasswordEL();
				this.show2faButton();
			});
		}
	}

	startPasswordEL() {
		const oldPwsd = document.getElementById('old_password');
		const pswdLabel = document.getElementById('oldPasswordLabel');

		if (oldPwsd && pswdLabel) {
			this.addEventListener(oldPwsd, 'focus', () => {
				pswdLabel.innerHTML = "Current password";
			});

			this.addEventListener(oldPwsd, 'blur', () => {
				pswdLabel.innerHTML = "Change password";
			});
		}

	}

	backToProfilePrimaryPage() {
		const container = document.getElementById('rootProfile');
		if (container) {
			const userInfo = container.querySelector('#userInfo');
			const userEdit = container.querySelector('#userEdit');

			if (userInfo && userEdit) {
				userInfo.style.display = "block";
				userEdit.style.display = "none";

				this.displayUserInfo(this.params.username);

				const editForm = container.querySelector('#editForm');
				if (editForm)
					editForm.reset();

				setTimeout(() => languageSelector.updateLanguage(), 0);
			}

		}
	}

	setUpEventListeners() {
		this.setUpOnSubmitFormBtn();
		this.setUpEnable2fa();
		this.setUpBackProfileBtn();
	}

	setUpOnSubmitFormBtn() {
		const editForm = document.getElementById('editForm');
		if (editForm) {
			this.addEventListener(editForm, 'submit', async (event) => {
				event.preventDefault();

				const inputNewUsername = editForm.querySelector('#new_username').value.trim();
				const inputAvatar = editForm.querySelector('#avatar').files.length > 0;
				const inputOldPassword = editForm.querySelector('#old_password').value.trim();
				const inputNewPassword = editForm.querySelector('#new_password').value.trim();
				const inputConfirmPassword = editForm.querySelector('#confirm_password').value.trim();
				const inputLanguageSelector = editForm.querySelector('#language_selector').value.trim();

				if (inputNewUsername || inputAvatar || inputOldPassword || inputNewPassword || inputConfirmPassword || inputLanguageSelector) {
					const fileInput = editForm.querySelector('#avatar');
					const maxSize = 1 * 1024 * 1024;

					if (fileInput && fileInput.files[0] && fileInput.files[0].size > maxSize) {
						customAlert('danger', 'Avatar\'s file is so big. Maximum size: 1MB', 5000);
						return;
					}

					const formData = new FormData(event.target);
					formData.append('language', document.getElementById('language_selector').value);

					let passwordFields = ['old_password', 'new_password', 'confirm_password'];
					let isAnyFilled = passwordFields.some(field => formData.get(field));

					if (isAnyFilled) {
						for (const [key, value] of formData.entries()) {
							if (passwordFields.includes(key) && !value) {
								customAlert('info', 'To change the password, all three fields are required (old password, new password, confirm password).', 5000);
								event.target.querySelector(`[name="${key}"]`)?.focus();
								return;
							}
						}
					}

					if (inputOldPassword && (inputNewPassword && inputNewPassword !== inputConfirmPassword)) {
						customAlert('danger', 'Passwords do not match.', 5000);
						return;
					}


					try {
						const response = await fetch("/api/update_user_info/", {
							method: "POST",
							body: formData,
							credentials: 'include'
						});

						await handleResponse(response, data => {
							customAlert('success', data.message, 3000);
							this.backToProfilePrimaryPage();
						});

					} catch (error) {
						if (error.errorCode === 400 || error.errorCode === 403) {
							if (error.errorMessage.empty) {
								customAlert('warning', error.errorMessage.empty, '5000');
							}

							else if (error.errorMessage.username) {
								const inputUsername = event.target.querySelector('#new_username');
								if (inputUsername) {
									inputUsername.value = '';
									inputUsername.focus();
								}

								customAlert('danger', error.errorMessage.username, 5000);
							}

							else if (error.errorMessage.password42) {
								for (const [key, value] of formData.entries()) {
									if (['old_password', 'new_password', 'confirm_password'].includes(key)) {
										event.target.querySelector(`[name="${key}"]`).value = '';
									}
								}
								customAlert('danger', error.errorMessage.password42, 5000);
							}

							else if (error.errorMessage.passwordMiss) {
								customAlert('warning', error.errorMessage.passwordMiss, 5000);

								for (const [key, value] of formData.entries()) {
									if (['old_password', 'new_password', 'confirm_password'].includes(key) && !value) {
										event.target.querySelector(`[name="${key}"]`)?.focus();
										break ;
									}
								}
							}

							else if (error.errorMessage.oldPassword) {
								customAlert('danger', error.errorMessage.oldPassword, 5000);

								const inputOldPass = event.target.querySelector('#old_password');
								if (inputOldPass) {
									inputOldPass.value = '';
									inputOldPass.focus();
								}
							}

							else if (error.errorMessage.password) {
								if (Array.isArray(error.errorMessage.password)) {
									let responseMessage = '';

									error.errorMessage.password.forEach(message => {
										responseMessage += message + ' ';
									});

									customAlert('danger', responseMessage.trim(), 6000);
								} else {
									customAlert('danger', error.errorMessage.password, 5000);
								}

								const inputPass = event.target.querySelector('#new_password');
								const inputConfPass = event.target.querySelector('#confirm_password');

								if (inputConfPass && inputConfPass) {
									inputPass.value = '';
									inputConfPass.value = '';
									inputPass.focus();
								}
							}

							else if (error.errorMessage.language) {
								customAlert('danger', error.errorMessage.language, 5000);
							}

							else {
								customAlert('danger', error.errorMessage, 5000);
							}
						} else {
							console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
						}
					}

				} else {
					customAlert('danger', 'No data provided for update.', 5000);
				}

			});
		}
	}

	setUpEnable2fa() {
		const twofaBtn = document.getElementById("Enable2faBtn");

		if (twofaBtn) {
			this.addEventListener(twofaBtn, "click", async () => {
				try {
					const confirmed = window.confirm("Are you sure you want to enable two-factor authentication? Once enabled, you will only be able to disable it using the security code after scanning the QR code.");

					if (confirmed) {
						const response = await fetch("/api/2fa/enable2fa/", {
							method: 'POST',
							credentials: 'include',
							headers: {
								'Content-Type': 'application/json',
							},
						});

						await handleResponse(response, data => {
							this.renderTwoFaModalHtml();

							const ModalElement = document.getElementById('imageModal');
							if (ModalElement) {

								if (!this.qrModalInstance)
									this.qrModalInstance = new bootstrap.Modal(ModalElement, {backdrop: false});

								this.addEventListener(ModalElement, 'hide.bs.modal', () => {
									this.deleteQRModal();
								});

								const imageSpan = document.getElementById('modalImageContainer');

								if (imageSpan && data['qrpath']) {
									imageSpan.innerHTML = `<img src="/media/${data['qrpath']}" class="w-75">`;
									this.qrModalInstance.show();
								}

								const btnEnable2faModal = ModalElement.querySelector('#two_fa_modal_enable_btn')
								if (btnEnable2faModal) {
									this.addEventListener(btnEnable2faModal, 'click', async () => {

										const confirmed = window.confirm("Are you sure you scanned the code? If not, you won’t be able to deactivate 2FA, and you may lose access to your account.");

										if (confirmed) {
											await this.confirm2fa();

											if (this.qrModalInstance)
												this.qrModalInstance.hide();

											this.deleteQRModal();
										}

									});
								}
							}
						});
					}
				} catch (error) {
					if (error.errorCode === 403) {
						if (error.errorMessage) {
							customAlert('danger', error.errorMessage, 5000);
						}
					} else {
						console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
					}
				}
			});
		}
	}

	setUpBackProfileBtn() {
		const profileBackBtn = document.getElementById('profile_edit_back_btn');

		if (profileBackBtn) {
			this.addEventListener(profileBackBtn, 'click', () => {
				this.backToProfilePrimaryPage();
			});
		}
	}

	setUpLogout() {
		const logoutBtn = document.getElementById("logoutBtn");

		if (logoutBtn) {
			this.addEventListener(logoutBtn, "click", async () => {
				try {
					const response = await fetch("/api/logout/", {
						method: "GET",
						credentials: 'include'
					});

					await handleResponse(response, () => {
						closeGlobalSockets();
						navigateTo("/login");
					});
				} catch(error) {
					console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
				}
			});
		}
	}

	show2faButton() {
		let EnableButtonPlaceholder = document.getElementById("Enable2faBtn");
		let DisableButtonPlaceholder = document.getElementById("Disable2faBtn");

		fetch("/api/user_from_intra", {
			method: "GET",
			credentials: 'include',
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json();
		})
		.then(data => {
			if (data['intra_login'] === false) {
				fetch("/api/2fa/check2fa/", {
					method: "GET",
					credentials: 'include',
				})
				.then(response => {
					if (!response.ok) {
						return response.json().then(errData => {
							throw new Error(errData.error || `Response status: ${response.status}`);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data["has2faEnabled"] == true) {
						EnableButtonPlaceholder.style.display = "none";
						DisableButtonPlaceholder.style.display = "block";
					}
					else {
						EnableButtonPlaceholder.style.display = "block";
						DisableButtonPlaceholder.style.display = "none";
					}
				})
			}
		})
		.catch(error => {
			customAlert('danger', `Error: ${error.message}`, 5000);
		});
	}

	async confirm2fa() {
		try {
			const response = await fetch("/api/2fa/confirmDevice/", {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			await handleResponse(response, () => {
				this.show2faButton();
			});

		} catch (error) {
			console.error(error.errorCode ? `Error ${error.errorCode}: ${error.errorMessage}` : `Critical error: ${error.errorMessage}`);
		}
	}

	deleteQRModal() {
		setTimeout(() => {
			const container = document.getElementById('twofa_modal_container');
			if (container)
				container.innerHTML = '';
		}, 300);

		this.qrModalInstance = null;
	}

	renderTwoFaModalHtml() {
		const container = document.getElementById('twofa_modal_container');
		if (container) {
			container.innerHTML = `
				<div class="modal fade modal-background" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
					<div class="modal-dialog modal-dialog-centered">
						<div class="modal-content">
							<div class="modal-body">
								<!-- Placeholder for dynamic image -->
								<span id="modalImageContainer" class="d-flex justify-content-center"></span>
							</div>
							<div class="modal-footer align-center justify-content-around border-0">
								<button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>
								<button type="button" class="btn btn-success" id="two_fa_modal_enable_btn">Enable</button>
							</div>
						</div>
					</div>
				</div>`;
		}
	}

	selectStats() {
		let ownStatsBtn = document.getElementById("ownStatsBtn");
		let friendshipStatsBtn = document.getElementById("friendshipStatsBtn");
		const ownStats = document.getElementById("ownStatsDisplay");
		const friendshipStats = document.getElementById("friendshipStatsDisplay");

		this.addEventListener(ownStatsBtn, 'click', () => {
			ownStatsBtn.classList.add('active');
			ownStats.classList.remove('hide');
			friendshipStatsBtn.classList.remove('active');
			friendshipStats.classList.add('hide');
		});

		this.addEventListener(friendshipStatsBtn, 'click', () => {
			friendshipStatsBtn.classList.add('active');
			friendshipStats.classList.remove('hide');
			ownStatsBtn.classList.remove('active');
			ownStats.classList.add('hide');
		});
	}

	async disable2fa() {
		const TwofaBtn = document.getElementById("Disable2faBtn");

		if (TwofaBtn) {
			const username = await this.getOwnName()
			this.addEventListener(TwofaBtn, "click", async (event) => {
				const TwoFactorCodeModalInstance = staticComponentsRenderer.getComponentInstance('Get2faCode');
				await TwoFactorCodeModalInstance.initTwoFactorAuth({"username": username});

				try {
					const response = await fetch("/api/2fa/disable2fa/", {
						method: 'POST',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
						},
					});

					await handleResponse(response, () => {
						this.show2faButton();
					});
				} catch (error) {

				}

			});
		}
	}
}
