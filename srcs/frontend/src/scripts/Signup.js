import { Page } from './Page.js';
import { navigateTo } from './index.js';

export class Signup extends Page {
	constructor() {
		super("/pages/signup.html");
	}

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		this.initSignupForm();
	}

	initSignupForm() {
		const signupForm = document.querySelector("#signupForm");

		if (signupForm) {
		signupForm.addEventListener("submit", function(event) {
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
			body: JSON.stringify(jsonData)
			})
			.then(response => {
			if (response.status === 201)
				return response.json();
			else {
				return response.json().then(errData => {
				document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
				throw new Error(`Error ${response.status}`);
				});
			}
			})
			.then(data => {
			console.log("Success", data);
			navigateTo("/play");
			})
			.catch(error => {
			console.error("Error: ", error);
			});
		});
		}
	}

}
