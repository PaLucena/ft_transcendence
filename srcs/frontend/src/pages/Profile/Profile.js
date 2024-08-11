import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { closeUserWebSocket } from '../../scripts/websocket.js';

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
}
