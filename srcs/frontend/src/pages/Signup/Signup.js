import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from '../../scripts/utils/customAlert.js';
import { onlineSocket } from '../../scripts/utils/OnlineWebsocket.js';

export class Signup extends Component {
	constructor() {
		console.log('Signup Constructor');
		super('/pages/Signup/signup.html');
	}

	destroy() {
		console.log("Signup Custom destroy");
		this.removeAllEventListeners();
    }

	init() {
		this.initSubmitForm()
	}

	initSubmitForm() {
		const signup_form = document.getElementById('signup_form')
		
		this.addEventListener(signup_form, 'submit', (event) => {
			let password = $('#password').val();
			let confirmPassword = $('#confirm_password').val();
			let formIsValid = true;

			if (password !== confirmPassword) {
				event.preventDefault();
				$('#confirm_password').addClass('is-invalid').removeClass('is-valid');
				$('#confirm_password')[0].setCustomValidity('Passwords do not match.');
				formIsValid = false;
			}
			else {
				$('#confirm_password').removeClass('is-invalid').addClass('is-valid');
				$('#confirm_password')[0].setCustomValidity('');
			}

			if (formIsValid) {
				event.preventDefault();

				const formData = new FormData(event.target);
				let jsonData = {};

				formData.forEach((value, key) => {
					jsonData[key] = value;
				});

				const csrftoken = getCSRFToken('csrftoken');

				fetch("/api/signup/", {
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
					onlineSocket.initWebSocket();
					customAlert('success', 'Account was created successfully', 3000);
					navigateTo("/play");
				})
				.catch(error => {
					customAlert('danger', `Error: ${error.message}`, '');
				});
			}

			this.classList.add('was-validated');
		});

		$('#confirm_password, #password').on('input', function() {
			let password = $('#password').val();
			let confirmPassword = $('#confirm_password').val();

			if (password !== confirmPassword) {
				$('#confirm_password').addClass('is-invalid').removeClass('is-valid');
				$('#confirm_password')[0].setCustomValidity('Passwords do not match.');
			} else {
				$('#confirm_password').removeClass('is-invalid').addClass('is-valid');
				$('#confirm_password')[0].setCustomValidity('');
			}
		});
	}
}
