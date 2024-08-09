import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js'
import { initUserWebSocket } from '../../scripts/websocket.js'
import { getCSRFToken } from '../../scripts/utils/csrf.js'

export class Login extends Component {
	constructor() {
		super('/pages/Login/login.html');
	}

	async init() {
		this.initLoginForm();
		this.intraLogin();
	}

	initLoginForm() {
		$('#username').find('[autofocus]').focus();
		$('#login_form').on('submit', function (event) {
			event.preventDefault();
			let formIsValid = true;

			if (!this.checkValidity()) {
				formIsValid = false
			}

			if (formIsValid) {
				const formData = new FormData(event.target);
				const jsonData = {};

				formData.forEach((value, key) => {
					jsonData[key] = value;
				});

				const csrftoken = getCSRFToken('csrftoken');

				fetch("/api/login/", {
					method: "POST",
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrftoken
					},
					body: JSON.stringify(jsonData)
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
			}

			this.classList.add('was-validated')
		})
	}

	intraLogin() {
		$('#intra_login').on('click', function() {
			window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code";
		})
	}
}
