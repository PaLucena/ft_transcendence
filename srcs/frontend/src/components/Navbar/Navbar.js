import { Component } from "../../scripts/Component.js";

export class Navbar extends Component {
	constructor() {
		super('/components/Navbar/navbar.html')
	}

	init() {
		this.initNavbar();
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
			document.getElementById("navItemProfile").src = `${data["avatar"]}`;
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}r
}
