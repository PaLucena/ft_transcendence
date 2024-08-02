import { Page } from '../Page.js';
import { navigateTo } from '../../scripts/router/router.js';
import { initUserWebSocket } from '../../scripts/websocket.js';

export class Signup extends Page {
	constructor() {
		super("/pages/Signup/signup.html");
	}

	async render() {
		return await super.render();
	}

	init() {
		this.initSignupForm();
	}

	initSignupForm() {
		const signupForm = document.querySelector("#signupForm");

		if (signupForm) {
			signupForm.addEventListener("submit", (event) => {
				event.preventDefault();

				const formData = new FormData(event.target);
				let jsonData = {};

				formData.forEach((value, key) => {
					jsonData[key] = value;
				});

				fetch("/api/signup/", {
					method: "POST",
					headers: {
					'Content-Type': 'application/json'
					},
					body: JSON.stringify(jsonData),
					credentials: 'include'
				})
				.then(response => {
					if (response.status === 201) {
						initUserWebSocket();
						return response.json();
					}
					else {
						return response.json().then(errData => {
							document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
							throw new Error(errData.error);
						});
					}
				})
				.then(data => {
					console.log("Success", data);
					navigateTo("/play");
				})
				.catch(error => {

				});
			});
		}
	}
}
