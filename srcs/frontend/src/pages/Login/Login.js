import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { onlineSocket } from '../../scripts/utils/OnlineWebsocket.js';
import { initTwoFactorAuth } from '../../components/Get2faModal/Get2faModal.js'; // Adjust path as needed

export class Login extends Component {
	constructor() {
		console.log('Login Constructor');
		super('/pages/Login/login.html');
	}

	async init() {
		this.initLoginForm();
		this.intraLogin();
	}

	destroy() {
		console.log("Login Custom destroy");
		this.removeAllEventListeners();
    }

	initLoginForm() {
		//document.getElementById('username').querySelector('[autofocus]').focus();
		const loginForm = document.getElementById('login_form');
		this.addEventListener(loginForm, 'submit', function (event) {
			event.preventDefault();
			let formIsValid = true;
			if (!this.checkValidity()) {
				formIsValid = false
			}

			if (formIsValid) {
				event.preventDefault();

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
					if (!response.ok) {
						return response.json().then(errData => {
							throw new Error(errData.error || `Response status: ${response.status}`);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data.has_2fa == true) {
						initTwoFactorAuth(jsonData);
					} else {
						onlineSocket.initWebSocket(jsonData["username"]);
						customAlert('success', 'Login successful', 3000);
						navigateTo("/play");
					}
				})
				.catch(error => {
					customAlert('danger', `Erroor: ${error.message}`, '');
					console.log(error);
				});
			}

			this.classList.add('was-validated')
		})
	}

	intraLogin() {
		const intraLogin = document.getElementById('intra_login');

		this.addEventListener(intraLogin, 'click', () => {
			window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code";
		})
	}
}
