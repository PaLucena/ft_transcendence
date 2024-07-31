import { Page } from './Page.js';
import { navigateTo } from './index.js'

export class Login extends Page {
	constructor() {
		super("/pages/login.html");
	}

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		this.initLoginForm();
	}

	initLoginForm() {
		const loginForm = document.querySelector("#loginForm");

		loginForm.addEventListener("submit", function(event) {
			event.preventDefault();

			const formData = new FormData(event.target);
			const jsonData = {};

			formData.forEach((value, key) => {
				jsonData[key] = value;
			});

			fetch("/api/login/", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(jsonData)
			})
			.then(response => {
				if (response.status === 200)
					return response.json();
				else { //TODO: Aqui tengo que manejar los códigos de error
					return response.json().then(errData => {
						document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
						throw new Error("Error ${response.status}");
					});
				}
			})
			.then(data => {
				console.log("Login successful", data);
				navigateTo("/play");
			})
			.catch((error) => {
				console.error("Login error: ", error);
			})
		})
	}
}
