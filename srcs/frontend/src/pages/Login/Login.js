import { Page } from '../Page.js';
import { navigateTo } from '../../scripts/router/router.js'

export class Login extends Page {
	constructor() {
	}

	render() {
		return `<div id="rootLogin" class="d-flex justify-content-center align-items-center">
	<div id="body" class="row align-items-center rounded">
		<div class="d-flex justify-content-center pb-4 " style="align-content: center;">
			<h1 class="display-3 mt-3" style="letter-spacing: 2rem; text-align: center;">PONG</h1>
		</div>
		<form id="loginForm">
			<div class="row mb-3">
				<div class="col-sm-8" id="form">
					<input type="text" id="username" name="username" required>
					<label for="username">Username</label>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-8" id="form">
					<input type="password" id="password" name="password" required>
					<label for="password">Password</label>
				</div>
			</div>
			<div class="row mb-1 justify-content-center">
				<a class="btn btn-link" href="#">Forgot your password?</a>
			</div>
			<div class="text-center">
				<span id="errorPlaceholder" class="bg-danger"></span>
			</div>
			<div class="row text-center col-sm-8 mx-auto mb-2 justify-content-center">
				<button type="submit" class="btn btn-success fw-bold shadow">LOGIN</button>
			</div>
		</form>
		<div class="d-flex text-center col-12 mx-auto justify-content-center">
			<p>Don't have an account? <a href="/signup">Sign up</a></p>
		</div>
		<hr>
		<div class="d-flex text-center col-8 mx-auto pt-2 pb-4 justify-content-center">
			<button type="button" class="btn btn-primary" onclick="window.location.href='https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code'">
				<img src="src/assets/images/42.png" id="fortytwo" alt="42 Logo">
			</button>
		</div>
	</div>
</div>
`
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
					// this.initUserWebSocket();
					// return response.json();
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

	// initUserWebSocket() {
	// 	const socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

	// 	socket.onopen = (e) => {
	// 		console.log("[open] Connection established");
	// 		socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
	// 		//setInterval(null, 3600)
	// 	};

	// 	socket.onmessage = (event) => {
	// 		console.log(`[message] Data received from server: ${event.data}`);
	// 	};

	// 	socket.onclose = (event) => {
	// 		if (event.wasClean) {
	// 			console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	// 		} else {
	// 			console.error('[close] Connection died');
	// 		}
	// 	};

	// 	socket.onerror = (error) => {
	// 		console.error(`[error] ${error.message}`);
	// 	};
	// }

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
