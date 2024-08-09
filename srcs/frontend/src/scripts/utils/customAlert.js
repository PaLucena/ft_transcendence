/**
 * Displays an alert on the page with a specified type, text, duration, and optional custom style.
 *
 * @param {string} type - The type of alert corresponding to Bootstrap classes (e.g., 'primary', 'success', 'danger').
 * @param {string} text - The text to be displayed inside the alert.
 * @param {number} time - The time in milliseconds after which the alert will be hidden.
 * @param {string} [customStyle=''] - An optional custom style class to apply to the alert (e.g., 'transparent-blur').
 */

export default function customAlert (type, text, time, customStyle = '') {
    const customAlert = document.querySelector('#alert');
	if (customAlert) {
		let icon = '';

		switch (type) {
			case 'success':
				icon = '<i class="fa-solid fa-thumbs-up"></i>';
				break;
			case 'danger':
				icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
				break;
			case 'warning':
				icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
				break;
			case 'info':
				icon = '<i class="fa-solid fa-circle-info"></i>';
				break;
			default:
				icon = '';
				break;
		}

		customAlert.innerHTML = `<span class="alert-icon me-2">${icon}</span> ${text}`;

		customAlert.classList.add('alert', `alert-${type}`, 'active');

		if (customStyle) {
			customAlert.classList.add(customStyle);
		}

		setTimeout(() => {
			customAlert.classList.remove('active');

			setTimeout(() => {
				customAlert.classList.remove('alert', `alert-${type}`);

				if (customStyle) {
					customAlert.classList.remove(customStyle);
				}

				customAlert.innerHTML = '';
			}, 200);
		}, time);
	}
};

