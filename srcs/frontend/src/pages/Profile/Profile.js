import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js';
import { onlineSocket } from '../../scripts/utils/OnlineWebsocket.js';
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
		this.logout();
		this.saveInfoBtn(this.params.username);
		Navbar.focus()
		this.enable2fa();
		this.disable2fa();
		// this.sendServerMessage();
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
			if (myUsername === data["username"]) {
				document.getElementById("editBtn").style.display = "block";
				document.getElementById("logoutBtn").style.display = "block";
			}
			else {
				document.getElementById("blockBtn").style.display = "block";
				this.renderChatBtn(data["username"]);
			}

			document.getElementById("photoContainer").src = `${data["avatar"]}`;
			document.getElementById("usernamePlaceholder").innerHTML = data["username"];
			document.getElementById("friendsNbPlaceholder").innerHTML = data["number_of_friends"];

			this.editUserBtn(data);
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	renderChatBtn(username) {
		const chatBtn = document.createElement("button");
		chatBtn.innerHTML = `Chat with ${username}`;
		chatBtn.classList.add("btn", "btn-primary");
		chatBtn.id = "chatBtn";

		const profileBottomBtns = document.getElementById("profile_bottom_btns");

		profileBottomBtns.insertBefore(chatBtn, profileBottomBtns.firstChild);

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

		this.addEventListener(editForm, "submit", (event) => {
			event.preventDefault();

			const formData = new FormData(event.target);
			const jsonData = {};

			formData.forEach((value, key) => {
				jsonData[key] = value;
			});

			fetch("/api/update_user_info/", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(jsonData),
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
			})
		})
	}

	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		this.addEventListener(logoutBtn, "click", () => {
			fetch("/api/logout/", {
				method: "GET",
				credentials: 'include'
			})
			.then(response => {
				onlineSocket.closeWebSocket();
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
		fetch("/api/2fa/check2fa/", {
			method: "POST",
			credentials: 'include',
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json()
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
		.catch(error => {
			customAlert('danger', `Error: ${error.message}`, '');
		});
	}

	hideModal() {
		const response = fetch("/api/2fa/confirmDevice/", {
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
			const response = fetch("/api/2fa/enable2fa/", {
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


	disable2fa() {
		let TwofaBtn = document.getElementById("Disable2faBtn");
		TwofaBtn.addEventListener("click", (event) => {
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
	/*
	sendServerMessage() {
		let testBtn = document.getElementById('testBtn');
		if (testBtn) {
			testBtn.addEventListener("click", (event) => {
				onlineSocket.sendMessage("test", "ealgar-c")
			})
		}
	} */
}
