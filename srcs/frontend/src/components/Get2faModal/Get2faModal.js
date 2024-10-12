import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from '../../scripts/utils/customAlert.js';
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';

class Get2faCode {
	constructor() {
		this.modalInstance = null;
		this.username = null;
	}

	init(username) {
		if (this.modalInstance || this.username) this.destroy();

		this.username = username;
		this.initModalHtml();
		this.setUpOnHideModal();

		return new Promise((resolve, reject) => {
			try {
				this.initTwoFactorAuth(resolve);
			} catch (error) {
				reject(error);
			}
		});
	}

	initModalHtml() {
		const container = document.getElementById('get2faCode_modal');

		if (container) {
			const html = `
				<div id="customOverlay" class="twofactor-overlay"></div>

				<div class="modal fade modal-background" id="twoFactorModal" tabindex="-1" aria-labelledby="twoFactorModalLabel" aria-hidden="true">
					<div class="modal-dialog twofactor-modal-dialog">
						<div class="modal-content twofactor-modal-content">
							<div class="modal-header">
								<h5 class="modal-title" id="twoFactorModalLabel">Two-Factor Authentication</h5>
								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							<div class="modal-body">
								<form id="twoFactorForm">
									<div class="mb-3">
										<label for="otp" class="form-label">Enter your 2FA code</label>
										<div class="d-flex justify-content-between">
											<input type="text" class="otp-input" maxlength="1">
											<input type="text" class="otp-input" maxlength="1">
											<input type="text" class="otp-input" maxlength="1">
											<input type="text" class="otp-input" maxlength="1">
											<input type="text" class="otp-input" maxlength="1">
											<input type="text" class="otp-input" maxlength="1">
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>`;

			container.innerHTML = html;

			const modalDOM = container.querySelector('#twoFactorModal');
			if (modalDOM) {
				if (!this.modalInstance)
					this.modalInstance = new bootstrap.Modal(modalDOM, { backdrop: false, keyboard: true });

				this.modalInstance.show();
			}
		}
	}

	setUpOnHideModal() {
		const container = document.getElementById('get2faCode_modal');

		if (container || this.modalInstance) {
			const modalDOM = container.querySelector('#twoFactorModal');
			if (modalDOM) {
				modalDOM.addEventListener('hide.bs.modal', () => {
					setTimeout(() => {
						this.destroy();
					}, 300);
				});
			}
		}
	}

	initTwoFactorAuth(resolve) {
		const container = document.getElementById('twoFactorModal');
		if (container) {
			const inputs = document.querySelectorAll('.otp-input');

			setTimeout(() => inputs[0].focus(), 400);

			inputs.forEach((input, index) => {
				input.addEventListener('input', (event) => {
					const value = event.target.value;

					if (!/^\d$/.test(value)) {
						event.target.value = '';
						return;
					}
					if (value && index < inputs.length - 1) {
						inputs[index + 1].focus();
					}
					if (index === inputs.length - 1 && Array.from(inputs).every(input => input.value)) {
						this.submit2FAForm(inputs, resolve);
					}
				});

				input.addEventListener('keydown', (event) => {
					if (event.key === 'Backspace' && input.value === '') {
						if (index > 0) {
							inputs[index - 1].focus();
						}
					}
				});
			});
		}
	}

	async submit2FAForm(inputs, resolve) {
		const otpCode = Array.from(inputs).map(input => input.value).join('');
		const csrftoken = getCSRFToken('csrftoken');

		try {
			const response = await fetch("/api/2fa/verify-2fa/", {
				method: "POST",
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrftoken
				},
				body: JSON.stringify({ otpCode: otpCode, username: this.username })
			});

			await handleResponse(response, () => {
				resolve();

				if (this.modalInstance)
					this.modalInstance.hide();
			});

		} catch (error) {
			customAlert('danger', `${error.errorMessage}`, 5000);
			console.error(error);
			this.clearModal();
		}
	}

	clearModal() {
		const container = document.getElementById('twoFactorModal');
		if (container) {
			const inputs = document.querySelectorAll('.otp-input');

			if (inputs.length > 0)
				inputs.forEach(input => input.value = '');
			inputs[0].focus()
		}
	}

	destroy() {
		console.log("DESTROY 2FA");
		const container = document.getElementById('get2faCode_modal');

		if (container) {
			container.innerHTML = '';
		}

		this.username = null;
		this.modalInstance = null;
	}
}

export const get2faCode = new Get2faCode();
