import { navigateTo } from '../../scripts/Router.js'
import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from '../../scripts/utils/customAlert.js';
import { onlineSocket } from '../../scripts/utils/OnlineWebsocket.js';


export function initTwoFactorAuth(jsonData) {
    const inputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('twoFactorForm');
	const TwoFactorModalElement = document.getElementById('twoFactorModal');
	const overlayElement = document.getElementById('customOverlay');
	var TwoFactorModal = new bootstrap.Modal(TwoFactorModalElement, {backdrop: false, keyboard: true})

	TwoFactorModal.show();


	TwoFactorModalElement.addEventListener('shown.bs.modal', () => {
		if (inputs.length > 0) {
			inputs.forEach(input => input.value = '');
			inputs[0].focus(); // Focus the first input field
		}
	});

	function showModal() {
        overlayElement.style.display = 'block'; // Show the custom overlay
        TwoFactorModal.show();
    }

    function hideModal() {
        overlayElement.style.display = 'none'; // Hide the custom overlay
        TwoFactorModal.hide();
    }

	showModal();
	TwoFactorModalElement.addEventListener('hidden.bs.modal', hideModal);

    inputs.forEach((input, index) => {
        input.addEventListener('input', (event) => {
            const value = event.target.value;

            // Allow only numeric values
            if (!/^\d$/.test(value)) {
                event.target.value = '';
                return;
            }
            // Move to the next input
            if (value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            // If it's the last input and all are filled, submit the form
            if (index === inputs.length - 1 && Array.from(inputs).every(input => input.value)) {
                submit2FAForm(jsonData);
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

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        submit2FAForm(jsonData);
    });

    function submit2FAForm(username) {
        const otpCode = Array.from(inputs).map(input => input.value).join('');
        const csrftoken = getCSRFToken('csrftoken');

        fetch("/api/2fa/verify-2fa/", {
            method: "POST",
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({otpCode: otpCode, jsonData})
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
					if (response.status === 400) {
                        inputs.forEach(input => input.value = '');
                        inputs[0].focus();
                    }
                    throw new Error(errData.error || `Response status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
			jsonData = {
				"username": username
			}
            customAlert('success', '2FA Verified!', 3000);
			fetch("/api/2fa-login/", {
				method: "POST",
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(jsonData)
			}).then(response => {
				return response.json();
			})
			.then(data =>{
				onlineSocket.initWebSocket();
				navigateTo("/play");
			})
        })
        .catch(error => {
            customAlert('danger', `Error: ${error.message}`, '');
        });
    }
}
