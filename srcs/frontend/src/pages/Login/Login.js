import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { initUserWebSocket } from '../../scripts/websocket.js'

export class Login extends Component {
	constructor() {
		super('/pages/Login/login.html');
	}

	async init() {
		this.initLoginForm();
		this.intraLogin();
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
				else {
					return response.json().then(errData => {
						document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
						throw new Error(errData.error);
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

	intraLogin() {
		const btn = document.getElementById("intraLogin");
		btn.addEventListener('click', () => {
			window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code";
		});
	}


	initUserWebSocket() {
		const socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

		socket.onopen = (e) => {
			console.log("[open] Connection established");
			socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
			//setInterval(null, 3600)
		};

		socket.onmessage = (event) => {
			console.log(`[message] Data received from server: ${event.data}`);
		};

		socket.onclose = (event) => {
			if (event.wasClean) {
				console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				console.error('[close] Connection died');
			}
		};

		socket.onerror = (error) => {
			console.error(`[error] ${error.message}`);
		};
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
