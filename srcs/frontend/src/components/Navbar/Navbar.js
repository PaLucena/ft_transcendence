import { Component } from "../../scripts/Component.js";

export class Navbar extends Component {
	constructor() {
		console.log('NavBar Constructor');
		super('/components/Navbar/navbar.html')
	}

	init() {
		this.initNavbar();
		this.focus();
	}

	initNavbar() {
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
			document.getElementById("navItem-profile").src = `${data["avatar"]}`;
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	
	static focus() {
		const page = window.location.pathname.slice(1);
		console.log("Estoy en: ", 'navItem-' + page);

		let navItems = document.querySelectorAll('[id^="navItem"]');
		navItems.forEach(navItem => {
			navItem.style.border = "";
		});
		document.getElementById('navItem-' + page).style.border = "2px solid #edeef0";
	}
}
