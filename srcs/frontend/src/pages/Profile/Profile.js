import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

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
			})
			.then(response => {
				console.log("Respuesta a logout: ", response); // TODO: esto es debuggeo
				navigateTo("/login");
			})
			.catch((error) => {
				console.log("Logout error: ", error);
			})
		});
	}
}
