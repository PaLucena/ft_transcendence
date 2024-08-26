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

		this.addEventListener(editBtn, "click", (event) => {
			document.getElementById("userInfo").style.display = "none";
			document.getElementById("userEdit").style.display = "block";
		});
	}

	saveInfoBtn() {
		let saveInfo = document.getElementById("saveInfo");

		this.addEventListener(saveInfo, "click", (event) => {
			//TODO: aquí falta hacer un fetch con post para guardar la información de usuario
			document.getElementById("userEdit").style.display = "none"; // Esto es solo si la información
			document.getElementById("userInfo").style.display = "block";  // nueva es válida
		});
		this.enable2fa();
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

	enable2fa() {
		let twofaBtn = document.getElementById("2faBtn");

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
				const overlayElement = document.getElementById('customOverlay');
				var qrmodal = new bootstrap.Modal(ModalElement, {backdrop: false, keyboard: false})
				const csrftoken = getCSRFToken('csrftoken');
				const imageSpan = document.getElementById('modalImageContainer');
				console.log(data['qrpath'])
				imageSpan.innerHTML = `<img src="/media/${data['qrpath']}" class="w-75">`
				qrmodal.show()
			})
		})
	}
}
