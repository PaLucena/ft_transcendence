import { Page } from '../Page.js';
import { navigateTo } from '../../scripts/router/router.js'
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

export class Profile extends Page {
	constructor() {
		super("/pages/Profile/profile.html")
	}

	async render() {
		return super.render();
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
		this.logout();
	}

	logout() {
		let	logoutBtn = document.getElementById("logoutBtn");

		logoutBtn.addEventListener("click", (event) => {

			console.log("logout clicked"); // TODO: esto fuera

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
