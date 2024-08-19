import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { closeUserWebSocket } from '../../scripts/websocket.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from "../../scripts/utils/customAlert.js";

// import { showQRmodal } from '../../components/Show2faQRModal'

export class Profile extends Component {
	constructor() {
		super('/pages/Profile/profile.html')
	}

	init() {
		this.logout();
		this.editUserBtn();
		this.saveInfoBtn();
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
		this.enable2fa();
	}

	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		logoutBtn.addEventListener("click", (event) => {
			fetch("/api/logout/", {
				method: "GET",
				credentials: 'include'
			})
			.then(response => {
				closeUserWebSocket();
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
				console.log(data.qrpath)
				const ModalElement = document.getElementById('imageModal');
				const overlayElement = document.getElementById('customOverlay');
				var qrmodal = new bootstrap.Modal(ModalElement, {backdrop: false, keyboard: false})
				const csrftoken = getCSRFToken('csrftoken');
				console.log(data.qrpath)
				fetch("http://localhost:8000/media/" + data.qrpath, {
					method: "GET",
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrftoken
					},
					mode: 'no-cors'
				})
				.then(response => {
					console.log(response)
					if (!response.ok) {
						return response.json().then(errData => {
							throw new Error(errData.error || `Response status: ${response.status}`);
						});
					}
					return response.json();
				})
				.then(data => {
					console.log('hola');
					qrmodal.show()
				})
				.catch(error => {
					customAlert('danger', `Error: ${error.message}`, '');
				});
			})
		})
	}
}
