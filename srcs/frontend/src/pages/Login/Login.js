import { Page } from '../Page.js';
import { navigateTo } from '../../scripts/router/router.js'
import { initUserWebSocket } from '../../scripts/websocket.js'

export class Login extends Page {
	constructor() {
		super("/pages/Login/login.html");
	}

	async render() {
		return await super.render();
	}

	init() {
		this.initLoginForm();
	}

	getBase64Img(url) {
		fetch(url, {

		})
	}

	initLoginForm() {
		const loginForm = document.querySelector("#loginForm");

		loginForm.addEventListener("submit", (event) => {
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
				body: JSON.stringify(jsonData),
				credentials: 'include'
			})
			.then(response => {
				if (response.status === 200) {
					initUserWebSocket();
					return response.json();
				}
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

	// function getCSRFToken(csrftoken) {
	// 	var cookieValue = null;
	// 	if (document.cookie && document.cookie != '') {
	// 		var cookies = document.cookie.split(';');
	// 		for (var i = 0; i < cookies.length; i++) {
	// 			var cookie = jQuery.trim(cookies[i]);
	// 			if (cookie.substring(0, 10) == (csrftoken + '=')) {
	// 				cookieValue = decodeURIComponent(cookie.substring(10));
	// 				break;
	// 			}
	// 		}
	// 	}
	// 	return cookieValue;
	// }
}
