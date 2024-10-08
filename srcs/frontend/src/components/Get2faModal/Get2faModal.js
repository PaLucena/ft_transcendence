import { navigateTo } from '../../scripts/Router.js'
import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from '../../scripts/utils/customAlert.js';


import { Component } from "../../scripts/Component.js";

export class Get2faCode extends Component {
	constructor() {
		super('/components/Get2faModal/Get2faModal.html')
		this.promise = null;
	}

	init() {}

	clearModal(inputs) {
		if (inputs.length > 0)
			inputs.forEach(input => input.value = '');
		setTimeout(() => inputs[0].focus(), 400);
	}

	showModal(overlayElement, inputs, TwoFactorModal) {
		TwoFactorModal.show();
		setTimeout(() => this.clearModal(inputs), 0);
	}

	hideModal(overlayElement, inputs, TwoFactorModal) {
		this.clearModal(inputs);
		TwoFactorModal.hide();
	}

	async initTwoFactorAuth(jsonData) {
		const overlayElement = document.getElementById('customOverlay');
		const inputs = document.querySelectorAll('.otp-input');
		const TwoFactorModalElement = document.getElementById('twoFactorModal');
		let TwoFactorModal = new bootstrap.Modal(TwoFactorModalElement, { backdrop: false, keyboard: true })

		this.promise = new Promise(resolve => {
			this.showModal(overlayElement, inputs, TwoFactorModal);
			this.addEventListener(TwoFactorModalElement,'hidden.bs.modal', () => this.hideModal(overlayElement, inputs, TwoFactorModal));
			inputs.forEach((input, index) => {
				this.addEventListener(input, 'input', (event) => {
					const value = event.target.value;

					if (!/^\d$/.test(value)) {
						event.target.value = '';
						return;
					}
					if (value && index < inputs.length - 1) {
						inputs[index + 1].focus();
					}
					if (index === inputs.length - 1 && Array.from(inputs).every(input => input.value)) {
						submit2FAForm(jsonData, overlayElement, inputs, TwoFactorModal);
					}
				});

				this.addEventListener(input, 'keydown', (event) => {
					if (event.key === 'Backspace' && input.value === '') {
						if (index > 0) {
							inputs[index - 1].focus();
						}
					}
				});
			});

			inputs[0].focus();
			const submit2FAForm = (username, overlayElement, inputs, TwoFactorModal) => {
				const otpCode = Array.from(inputs).map(input => input.value).join('');
				const csrftoken = getCSRFToken('csrftoken');

				fetch("/api/2fa/verify-2fa/", {
					method: "POST",
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrftoken
					},
					body: JSON.stringify({ otpCode: otpCode, jsonData })
				})
				.then(response => {
					if (!response.ok) {
						this.clearModal(inputs);
						return response.json().then(errData => {
							throw new Error(errData.error || `Response status: ${response.status}`);
						});
					}
					return response.json();
				})
				.then(() => {
					resolve();
					this.hideModal(overlayElement, inputs, TwoFactorModal);
				})
				.catch(error => {
					customAlert('danger', `Error: ${error.message}`, 5000);
					console.log(error)
				});
			}
		})
		return this.promise;
	}

	destroy() {
		console.log("DESTROY 2FA");
		const overlayElement = document.getElementById('customOverlay');
		const inputs = document.querySelectorAll('.otp-input');
		const TwoFactorModalElement = document.getElementById('twoFactorModal');
		let TwoFactorModal = new bootstrap.Modal(TwoFactorModalElement, { backdrop: false, keyboard: true })
		this.hideModal(overlayElement, inputs, TwoFactorModal);
		this.promise = null;
		this.removeAllEventListeners();
	}
}
