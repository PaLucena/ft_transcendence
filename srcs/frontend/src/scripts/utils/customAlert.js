/**
 * Displays an alert on the page with a specified type, text, duration, and optional custom style.
 *
 * @param {string} type - The type of alert corresponding to Bootstrap classes (e.g., 'primary', 'success', 'danger').
 * @param {string} text - The text to be displayed inside the alert.
 * @param {number|string} time - The time in milliseconds after which the alert will be hidden. If an empty string is provided, the alert will be dismissed with the close button.
 * @param {string} [title] - An optional custom title for the alert (overrides the default).
 */

export default function customAlert(type, text, time, title = '') {
    const alertContainer = document.getElementById('alert_container');

    if (alertContainer) {
        const customAlert = document.createElement('aside');
        customAlert.classList.add('custom-alert');

        let icon = '';
        let messageTitle = title || '';

        switch (type) {
            case 'success':
                icon = '<i class="alert-icon fa-solid fa-check"></i>';
                messageTitle = messageTitle || 'Success';
                break;
            case 'danger':
                icon = '<i class="alert-icon fa-solid fa-exclamation"></i>';
                messageTitle = messageTitle || 'Error';
                break;
            case 'warning':
                icon = '<i class="alert-icon fa-solid fa-exclamation"></i>';
                messageTitle = messageTitle || 'Warning';
                break;
            case 'info':
                icon = '<i class="alert-icon fa-solid fa-info"></i>';
                messageTitle = messageTitle || 'Info';
                break;
            default:
                icon = '<i class="alert-icon fa-regular fa-bell"></i>';
                break;
        }

        customAlert.innerHTML = `
            <div class="me-2 d-flex justify-content-md-center align-items-center">
                ${icon}
                <div class="message">
                    <span class="text-1 fw-bold">${messageTitle}</span>
                    <span class="text-2 ">${text}</span>
                </div>
            </div>
            <i id="alert_close" class="fa-solid fa-xmark close" aria-hidden="true"></i>
            <div class="progress"></div>
        `;

        customAlert.classList.add('alert', `alert-${type}`, 'active');

        alertContainer.appendChild(customAlert);

        const progressBar = customAlert.querySelector('.progress');

        if (progressBar) {
            if (time && time !== '') {
                progressBar.classList.add('active');
                progressBar.style.setProperty('--progress-time', `${time}ms`);

                setTimeout(() => {
                    customAlert.classList.add('hide');

                    setTimeout(() => {
                        customAlert.remove();
                    }, 400);
                }, time);
            } else {
                progressBar.classList.remove('active');
            }
        } else {
            console.warn('progress bar is not found.')
        }

        const closeButtonElement = customAlert.querySelector('#alert_close');
        if (closeButtonElement) {
            closeButtonElement.addEventListener('click', () => {
                customAlert.classList.add('hide');

                setTimeout(() => {
                    customAlert.remove();
                }, 400);
            });
        } else {
            console.warn('alert_close is not found.')
        }
    } else {
        console.warn('alert_container is not found.')
    }
};
