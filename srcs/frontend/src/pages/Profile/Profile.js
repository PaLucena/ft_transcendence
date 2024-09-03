import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js';
import { onlineSocket } from '../../scripts/utils/OnlineWebsocket.js';
import customAlert from "../../scripts/utils/customAlert.js";

// import { showQRmodal } from '../../components/Show2faQRModal'

export class Profile extends Component {
	constructor() {
		console.log('Profile Constructor');
		super('/pages/Profile/profile.html')
	}

	destroy() {
		console.log("Profile Custom destroy");
		this.removeAllEventListeners();
    }

	init() {
		this.displayUserInfo();
		this.logout();
		this.saveInfoBtn();
		Navbar.focus()
		this.show2faButton();
		this.enable2fa();
		this.disable2fa();
		// this.sendServerMessage();
	}

	displayUserInfo() {
		fetch("/api/get_user_data/", {
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
			document.getElementById("photoContainer").src = `${data["avatar"]}`;
			document.getElementById("usernamePlaceholder").innerHTML = data["username"];
			document.getElementById("friendsNbPlaceholder").innerHTML = data["number_of_friends"];

			this.editUserBtn(data);
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	editUserBtn(userData) {
		const editBtn = document.getElementById("editBtn");

		this.addEventListener(editBtn, "click", () => {
			document.getElementById("userInfo").style.display = "none";
			document.getElementById("userEdit").style.display = "block";
			document.getElementById("username").value = `${userData["username"]}`;

			this.startPasswordEL();
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

	saveInfoBtn() {
		const editForm = document.getElementById("editForm");

		/* this.addEventListener(saveInfo, "click", () => {
			
			//TODO: aquí falta hacer un fetch con post para guardar la información de usuario
			document.getElementById("userEdit").style.display = "none"; // Esto es solo si la información
			document.getElementById("userInfo").style.display = "block";  // nueva es válida
		}); */
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
				//location.reload();
			})
			.catch((error) => {
				customAlert('danger', `Error: ` + error.message, '');
			})
		})
	}

	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		this.addEventListener(logoutBtn, "click", (event) => {
			fetch("/api/logout/", {
				method: "GET",
				credentials: 'include'
			})
			.then(response => {
				onlineSocket.closeWebSocket();
				console.log("Respuesta a logout: ", response); // TODO: esto es debuggeo
				navigateTo("/login");
			})
			.catch((error) => {
				console.log("Logout error: ", error);
			})
		});
	}

	 show2faButton() {
		let ButtonPlaceholder = document.getElementById("2faButtonPlaceholder");
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

	enable2fa() {
		let twofaBtn = document.getElementById("Enable2faBtn");

		function hideModal() {
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
			})
			.catch(error => {
				customAlert('danger', `Error: ${error.message}`, '');
			});
		}
		
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
				ModalElement.addEventListener('hidden.bs.modal', hideModal);
				qrmodal.show();
				this.show2faButton();
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