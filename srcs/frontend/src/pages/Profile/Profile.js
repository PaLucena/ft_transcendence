import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
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
		this.focusPage();
		this.displayUserInfo();
		this.logout();
		this.editUserBtn();
		this.saveInfoBtn();
		this.show2faButton();
		this.enable2fa();
		this.disable2fa();
	}

	focusPage() {
		let navItems = document.querySelectorAll('[id^="navItem"]');
		navItems.forEach(navItem => {
			navItem.style.border = "";
		});
		document.getElementById("navItemProfile").style.border = "2px solid #edeef0";
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
			console.log("Respuesta de get_user_data: ", response);
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json();
		})
		.then(data => {
			//document.getElementById("photoContainer").innerHTML = `<img class="profile-photo h-120 square rounded-circle col-12 shadow" src="${data["avatar"]}">`
			document.getElementById("photoContainer").src = `${data["avatar"]}`;
			document.getElementById("usernamePlaceholder").innerHTML = data["username"];
			document.getElementById("friendsNbPlaceholder").innerHTML = data["number_of_friends"];
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	editUserBtn() {
		let editBtn = document.getElementById("editBtn");

		editBtn.addEventListener("click", (event) => {
			document.getElementById("userInfo").style.display = "none";
			document.getElementById("userEdit").style.display = "block";
		});
	}

	saveInfoBtn() {
		let saveInfo = document.getElementById("saveInfo");

		saveInfo.addEventListener("click", (event) => {
			//TODO: aquí falta hacer un fetch con post para guardar la información de usuario
			document.getElementById("userEdit").style.display = "none"; // Esto es solo si la información
			document.getElementById("userInfo").style.display = "block";  // nueva es válida
		});
	}

	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		logoutBtn.addEventListener("click", (event) => {
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
		let EnableButtonPlaceholder = document.getElementById("Enable2faButtonPlaceholder");
		let DisableButtonPlaceholder = document.getElementById("Disable2faButtonPlaceholder");
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
				console.log("2fa is enabled")
			}
			else {
				EnableButtonPlaceholder.style.display = "block";
				DisableButtonPlaceholder.style.display = "none";
				console.log("2fa is disabled")
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
				return response.json();
			})
			.catch(error => {
				customAlert('danger', `Error: ${error.message}`, '');
			});
			this.show2faButton();
		}

		twofaBtn.addEventListener("click", (event) => {
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
				const overlayElement = document.getElementById('customOverlay');
				var qrmodal = new bootstrap.Modal(ModalElement, {backdrop: false, keyboard: false})
				const imageSpan = document.getElementById('modalImageContainer');
				imageSpan.innerHTML = `<img src="/media/${data['qrpath']}" class="w-75">`
				ModalElement.addEventListener('hidden.bs.modal', hideModal);
				qrmodal.show(); // TODO: adjust hidden modal
			})
		})
	}
	
	
	disable2fa() {
		let TwofaBtn = document.getElementById("Disable2faBtn");
		TwofaBtn.addEventListener("click", (event) => {
			console.log("a")
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