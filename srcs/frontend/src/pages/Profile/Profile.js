import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js';
import { userSocket } from '../../scripts/utils/UserWebsocket.js';
import customAlert from "../../scripts/utils/customAlert.js";
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';
import { staticComponentsRenderer } from '../../scripts/utils/StaticComponentsRenderer.js';

// import { showQRmodal } from '../../components/Show2faQRModal'

export class Profile extends Component {
	constructor(params = {}) {
		console.log('Profile Constructor');
		super('/pages/Profile/profile.html', params);
	}

	destroy() {
		console.log("Profile Custom destroy");
		this.removeAllEventListeners(this.params);
    }

	init() {
		this.displayUserInfo(this.params.username);
		this.saveInfoBtn(this.params.username);
		if (typeof this.params.username === "undefined")
			Navbar.focus();
		this.enable2fa();
		this.disable2fa();
		setTimeout(() => languageSelector.updateLanguage(), 0);
	}

	async displayUserInfo(username) {
		const fetchUrl = username ? `/api/get_other_user_data/${username}` : "/api/get_user_data/";
		const myUsername = await this.getOwnName();

		fetch(fetchUrl, {
			method: "GET",
			headers: {
				'Content-Type': 'application/json'
			},
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
			this.displayUserStats(data["username"]);

			if (myUsername === data["username"]) {
				document.getElementById("editPlaceholder").innerHTML = `<button id="editBtn" class="btn btn-green text-white" data-i18n='edit-profile'></button>`;
				document.getElementById("profile_bottom_btns").innerHTML = `<button id="logoutBtn" class="btn btn-outline-dark col-6" data-i18n='logout'></button>`;
				setTimeout(() => languageSelector.updateLanguage(), 0);
				this.editUserBtn(data);
				this.logout();

			}
			else {
				this.renderChatBtn(data["username"]);
				document.getElementById("ownStatsBtn").innerHTML = `${data['username']} <span data-i18n='stats'></span>`;

				if (!data['friendship']) {
					document.getElementById('statsPlaceholder').innerHTML = `<div class="h-100 w-100 d-flex justify-content-center align-items-center"><h1><span data-i18n='friend'></span>n't</h1></div>`;
				}

				if (data['friendship'] && data['matches_in_common']) {
					document.getElementById('statsSelector').innerHTML += `<button id="friendshipStatsBtn" class="btn btn-outline-dark position-relative" data-i18n="our-stats"></button>`;
					document.getElementById('friendName').innerHTML = data['username'];
					this.displayFriendshipStats(data['username']);
					this.selectStats();
				}
			}

			document.getElementById("photoContainer").src = `${data["avatar"]}`;
			document.getElementById("usernamePlaceholder").innerHTML = data["username"];
			document.getElementById("friendsNbPlaceholder").innerHTML = data["number_of_friends"];
			if (data["number_of_friends"] == 1)
				document.getElementById("friendsText").setAttribute("data-i18n", "friend");
			setTimeout(() => languageSelector.updateLanguage(), 0);
		})
		.catch(error => {
			customAlert('danger', `Error: ` + error.message, '');
			console.log('Error(displayUserInfo):', error);
			if (error.message === "AppUser matching query does not exist.")
			document.getElementById("rootProfile").style.justifyContent = 'center';
			document.getElementById("rootProfile").style.alignItems = 'center';
			document.getElementById("rootProfile").innerHTML = '<p class="display-1" data-i18n="user-not-found"><p>';
			setTimeout(() => languageSelector.updateLanguage(), 0);
		})
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
			winRateBar.innerHTML = `${winRate}%`;
			winRateBar.style.width = `${winRate}%`;

			const liStats = document.querySelectorAll('#ownStatsList li');

			liStats.forEach(liStat => {
				let currStat = liStat.querySelectorAll('div')[1];
				currStat.innerHTML = data[currStat.id];
			});
		})
		.catch(error => {
			console.log("Error(displayUserStats):", error);
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
			document.getElementById('friendshipWinRateBar').innerHTML = data['player1_win_percentage'];
			document.getElementById('friendshipWinRateBar').style.width = `${data['player1_win_percentage']}%`;

			const liStats = document.querySelectorAll('#friendshipStatsList li');

			liStats.forEach(liStat => {
				let currStat = liStat.querySelectorAll('div')[1];
				currStat.innerHTML = data[currStat.id];
			});
		})
		.catch(error => {
			console.log("Error(displayUserStats):", error);
		})
	}

	renderChatBtn(username) {
		document.getElementById('chatBtnPlaceholder').innerHTML = '<button id="chatBtn" class="btn btn-green d-flex justify-content-center align-items-center ml-3 rounded-circle square"><img src="../../assets/icons/chat.svg" alt="Play icon" class="h-75"></button>';
		const chatBtn = document.getElementById("chatBtn");

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

	async getOwnName() {
		const response = await fetch('/api/get_user_data/', {
			method: "GET",
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});

		const data = await response.json();
		return data["username"];
	}

	editUserBtn() {
		const editBtn = document.getElementById("editBtn");

		this.addEventListener(editBtn, "click", () => {
			document.getElementById("userInfo").style.display = "none";
			document.getElementById("userEdit").style.display = "block";

			this.startPasswordEL();
			this.show2faButton();
		});
	}

	startPasswordEL() {
		const oldPwsd = document.getElementById('old_password');
		const pswdLabel = document.getElementById('oldPasswordLabel');

		this.addEventListener(oldPwsd, 'focus', () => {
			pswdLabel.innerHTML = "Current password";
		});

		this.addEventListener(oldPwsd, 'blur', () => {
			pswdLabel.innerHTML = "Change password";
		});
	}

	saveInfoBtn(username) {
		const editForm = document.getElementById("editForm");
	
		this.addEventListener(editForm, "submit", async (event) => {
			event.preventDefault();
	
			const formData = new FormData(event.target);
			formData.append('language', document.getElementById('language_selector').value);
	
			fetch("/api/update_user_info/", {
				method: "POST",
				body: formData,
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
				customAlert('success', data.message, '3000');
				document.getElementById("userInfo").style.display = "block";
				document.getElementById("userEdit").style.display = "none";
				this.displayUserInfo(username);
			})
			.catch((error) => {
				customAlert('danger', `Error: ` + error.message, '');
			});
		});
	}


	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		this.addEventListener(logoutBtn, "click", () => {
			fetch("/api/logout/", {
				method: "GET",
				credentials: 'include'
			})
			.then(response => {
				userSocket.closeWebSocket();
				navigateTo("/login");
			})
			.catch((error) => {
				console.log("Logout error: ", error);
			})
		});
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
			customAlert('danger', `Error: ${error.message}`, '');
		});
	}

	hideModal() {
		fetch("/api/2fa/confirmDevice/", {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			this.show2faButton();
		})
		.catch(error => {
			customAlert('danger', `Error: ${error.message}`, '');
		});
	}

	enable2fa() {
		let twofaBtn = document.getElementById("Enable2faBtn");

		this.addEventListener(twofaBtn, "click", (event) => {
			fetch("/api/2fa/enable2fa/", {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			})
			.then(response => {
				return response.json()
			})
			.then(data => {
				const ModalElement = document.getElementById('imageModal');
				var qrmodal = new bootstrap.Modal(ModalElement, {backdrop: false, keyboard: false})
				const imageSpan = document.getElementById('modalImageContainer');

				imageSpan.innerHTML = `<img src="/media/${data['qrpath']}" class="w-75">`
				qrmodal.show();
				this.addEventListener(ModalElement, 'hidden.bs.modal', () => {this.hideModal()});
			})
		})
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
		let TwofaBtn = document.getElementById("Disable2faBtn");
		this.addEventListener(TwofaBtn, "click", (event) => {
			const TwoFactorCodeModalInstance = staticComponentsRenderer.getComponentInstance('Get2faCode');
			if (TwoFactorCodeModalInstance.initTwoFactorAuth(jsonData) === true){}
			const response = fetch("/api/2fa/disable2fa/", {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			})
			.then(response => {
				this.show2faButton();
			})
		})
	}
}
