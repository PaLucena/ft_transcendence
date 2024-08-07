import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';
import { closeUserWebSocket } from '../../scripts/websocket.js';

export class Profile extends Component {
	constructor() {
		super('/pages/Profile/profile.html')
	}

	init() {
		this.logout();
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
