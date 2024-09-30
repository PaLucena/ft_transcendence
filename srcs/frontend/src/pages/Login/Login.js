	import { Component } from '../../scripts/Component.js';
	import { navigateTo } from '../../scripts/Router.js';
	import { getCSRFToken } from '../../scripts/utils/csrf.js';
	import customAlert from '../../scripts/utils/customAlert.js';
	import { userSocket } from '../../scripts/utils/UserWebsocket.js';
	import { staticComponentsRenderer } from '../../scripts/utils/StaticComponentsRenderer.js';
	import { handleResponse } from '../../scripts/utils/rtchatUtils.js';

	export class Login extends Component {
		constructor() {
			super('/pages/Login/login.html');
			this.TwoFactorCodeModalInstance = null;
		}

		async init() {
			this.intraLogin();
			this.initLoginForm();
		}

		destroy() {
			this.removeAllEventListeners();
			if (this.TwoFactorCodeModalInstance)
				this.TwoFactorCodeModalInstance = null;
		}

		async submitLoginData(jsonData, csrftoken) {
			const response = await fetch("/api/login/", {
				method: "POST",
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrftoken
				},
				body: JSON.stringify(jsonData)
			});

			let returnData = null;
			await handleResponse(response, (data) => {
				returnData = data;
			});

			return returnData;
		}

		async checkTwoFactorAuth(csrftoken) {
			const response = await fetch("/api/2fa/check2fa", {
				method: "GET",
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrftoken
				},
			});

			let returnData = null;
			await handleResponse(response, (data) => {
				returnData = data;
			});

			return returnData;
		}

		async submitTwoFactorCode(jsonData) {
			const response = await fetch("/api/2fa-login/", {
				method: "POST",
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(jsonData)
			});

			await handleResponse(response, () => {
			});
		}

		async handleFormSubmit(jsonData) {
			const csrftoken = getCSRFToken('csrftoken');

			const loginData = await this.submitLoginData(jsonData, csrftoken);

			if (loginData.has_2fa) {
				if (!this.TwoFactorCodeModalInstance) {
					this.TwoFactorCodeModalInstance = staticComponentsRenderer.getComponentInstance('Get2faCode');

					const modal = document.getElementById('get2faCode_modal')
					let btn = modal.querySelector('.btn-close')

					this.addEventListener(btn, 'click', () => {
						this.TwoFactorCodeModalInstance.destroy();
						this.TwoFactorCodeModalInstance = null;
					});
					await this.TwoFactorCodeModalInstance.initTwoFactorAuth(jsonData);
					this.TwoFactorCodeModalInstance.destroy();
					this.TwoFactorCodeModalInstance = null;
				}

				await this.submitTwoFactorCode(jsonData);
			}
		}

		initLoginForm() {
			const loginForm = document.getElementById('login_form');
			if (loginForm) {
				loginForm.querySelector('input').focus();

				this.addEventListener(loginForm, 'submit', async (event) => {
					event.preventDefault();
					let formIsValid = true;

					if (!event.target.checkValidity()) {
						formIsValid = false;
					}

					if (formIsValid) {
						const jsonData = {
							username: event.target.querySelector('#username').value,
							password: event.target.querySelector('#password').value
						};

						try {
							await this.handleFormSubmit(jsonData);
							userSocket.initWebSocket();
							customAlert('success', 'Login successful', 3000);
							navigateTo("/play");

						} catch (error) {
							this.handleError(error.errorCode, error.errorMessage);
						}
					} else {
						const errorContainer = event.target.querySelector('#js_flash_container');

						if (errorContainer) {
							errorContainer.innerHTML=`
								<div class="flash alert alert-danger m-0">
									All fields are required.
								</div>`;
						}
						const inputs = event.target.querySelectorAll('input');
						for (let input of inputs) {
							if (!input.value) {
								input.focus();
								break;
							}
						}
					}

					event.target.classList.add('was-validated');
				});
			} else {
				console.warn('login_form is not found.');
			}
		}


		intraLogin() {
			const intraLogin = document.getElementById('intra_login');

			if (intraLogin) {
				this.addEventListener(intraLogin, 'click', () => {
					window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code";
				});
			} else {
				console.warn('intra_login is not found.');

			}
		}

		handleError(errorCode, errorMessage) {
			switch (errorCode) {
				case 400:
					customAlert('danger', `${errorMessage || 'All fields are required.'}`, 5000);
					break;
				case 404:
					const loginForm = document.getElementById('login_form');
					const errorContainer = loginForm.querySelector('#js_flash_container');

					if (errorContainer) {
						errorContainer.innerHTML=`
							<div class="flash alert alert-danger m-0">
								Incorrect username or password.
							</div>`;

						loginForm.querySelector('#username').value = '';
						loginForm.querySelector('#password').value = '';

						loginForm.querySelector('#username').focus();
					} else {
						customAlert('danger', 'Incorrect username or password.', 5000);
					}
					break;
				default:
					console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
			}
		}
	}
