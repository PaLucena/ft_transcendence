import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { getCSRFToken } from '../../scripts/utils/csrf.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { userSocket } from '../../scripts/utils/UserWebsocket.js';
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';

export class Signup extends Component {
    constructor() {
        super('/pages/Signup/signup.html');
    }

    destroy() {
        this.removeAllEventListeners();
    }

    async init() {
        this.initSubmitForm();
    }

    async submitSignupData(jsonData, csrftoken) {
        const response = await fetch("/api/signup/", {
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

    async handleFormSubmit(jsonData) {
        const csrftoken = getCSRFToken('csrftoken');

        const signupData = await this.submitSignupData(jsonData, csrftoken);

        if (signupData) {
            userSocket.initWebSocket();
            customAlert('success', 'Account was created successfully', 3000);
            navigateTo("/play");
        }
    }


	initSubmitForm() {
		const signupForm = document.getElementById('signup_form');

		if (signupForm) {
			signupForm.querySelector('input').focus();

			this.addEventListener(signupForm, 'submit', async (event) => {
				event.preventDefault();
				const errorContainer = signupForm.querySelector('#js_flash_container');

				const inputs = signupForm.querySelectorAll('input');

				for (let input of inputs) {
					if (!input.value) {
						const fieldName = input.name.charAt(0).toUpperCase() + input.name.slice(1);
						errorContainer.innerHTML = `
							<div class="flash alert alert-danger m-0">
								${fieldName} is required.
							</div>`;
						input.focus();
						return;
					}
				}

				const password = signupForm.querySelector('#password');
				const confirmPassword = signupForm.querySelector('#confirm_password');
				if (password.value !== confirmPassword.value) {
					errorContainer.innerHTML = `
						<div class="flash alert alert-danger m-0">
							Passwords don't match.
						</div>`;
					password.value = '';
					confirmPassword.value = '';
					password.focus();
					return;
				}

				const jsonData = {
					username: signupForm.querySelector('#username').value,
					email: signupForm.querySelector('#email').value,
					password: password.value,
					confirm_password: confirmPassword.value,
				};

				try {
					await this.handleFormSubmit(jsonData);
				} catch (error) {
					this.handleError(error.errorCode, error.errorMessage);
				}

				signupForm.classList.add('was-validated');
			});
		} else {
			console.warn('signup_form is not found.');
		}
	}

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 400:
				const signupForm = document.getElementById('signup_form');
				const errorContainer = signupForm.querySelector('#js_flash_container');

				if (errorContainer) {
					if (errorMessage.code === 2001) {
						errorContainer.innerHTML = `
							<div class="flash alert alert-danger m-0 text-start">
								${errorMessage.message || 'Server data validation on signup error.'}
							</div>`;
						signupForm.querySelector('#username').value = '';
						signupForm.querySelector('#email').value = '';
						signupForm.querySelector('#password').value = '';
						signupForm.querySelector('#confirm_password').value = '';
						signupForm.querySelector('#username').focus();
					} else if (errorMessage.code === 2002) {
						errorContainer.innerHTML = `
							<div class="flash alert alert-danger m-0 text-start">
								${errorMessage.message || 'Server data validation on signup error.'}
							</div>`;
						signupForm.querySelector('#email').focus();
					} else {
						errorContainer.innerHTML = `
							<div class="flash alert alert-danger m-0 text-start">
								${errorMessage.message || 'Server data validation on signup error.'}
							</div>`;
						signupForm.querySelector('#password').value = '';
						signupForm.querySelector('#confirm_password').value = '';
						signupForm.querySelector('#password').focus();
					}
				} else {
					customAlert('danger', `${errorMessage.message || 'Server data validation on signup error.'}`, 5000);
				}

				break ;
            default:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        }
    }
}
