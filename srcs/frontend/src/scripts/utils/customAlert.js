/**
 * Displays an alert on the page with a specified type, text, duration, and optional custom style.
 *
 * @param {string} type - The type of alert corresponding to Bootstrap classes (e.g., 'primary', 'success', 'danger').
 * @param {string} text - The text to be displayed inside the alert.
 * @param {number|string} time - The time in milliseconds after which the alert will be hidden. If an empty string is provided, the alert will be dismissed with the close button.
 * @param {string} [customStyle=''] - An optional custom style class to apply to the alert (e.g., 'transparent-blur').
 */

export default function customAlert(type, text, time, customStyle = '') {
    const customAlert = document.querySelector('#alert');
    if (customAlert) {
        const baseClasses = ['custom-alert'];

        const classesToRemove = [];
        customAlert.classList.forEach(className => {
            if (!baseClasses.includes(className)) {
                classesToRemove.push(className);
            }
        });

        classesToRemove.forEach(className => {
            customAlert.classList.remove(className);
        });

        let icon = '';
        let messageTitle = '';

        switch (type) {
            case 'success':
                icon = '<i class="alert-icon fa-solid fa-check"></i>';
                messageTitle = 'Success';
                break;
            case 'danger':
                icon = '<i class="alert-icon fa-solid fa-exclamation"></i>';
                messageTitle = 'Error';
                break;
            case 'warning':
                icon = '<i class="alert-icon fa-solid fa-exclamation"></i>';
                messageTitle = 'Warning';
                break;
            case 'info':
                icon = '<i class="alert-icon fa-solid fa-info"></i>';
                messageTitle = 'Info';
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

        if (customStyle) {
            customAlert.classList.add(customStyle);
        }

        const progressBar = customAlert.querySelector('.progress');

        if (time && time !== '') {
            const animationStyle = document.createElement('style');
            animationStyle.innerHTML = `
                @keyframes customProgress {
                    100% {
                        right: 100%;
                    }
                }
                .custom-alert .progress.active:before {
                    animation: progress ${time}ms linear forwards;
                }
            `;
            document.head.appendChild(animationStyle);

            progressBar.classList.add('active');

            setTimeout(() => {
                customAlert.classList.remove('active');
                progressBar.classList.remove('active');

                setTimeout(() => {
                    customAlert.classList.remove('alert', `alert-${type}`);
                    if (customStyle) {
                        customAlert.classList.remove(customStyle);
                    }

                    customAlert.innerHTML = '';
                    document.head.removeChild(animationStyle);
                }, 200);
            }, time);
        } else {
            progressBar.classList.remove('active');
        }

        const closeButtonElement = customAlert.querySelector('#alert_close');
        if (closeButtonElement) {
            closeButtonElement.addEventListener('click', () => {
                customAlert.classList.remove('active');
                progressBar.classList.remove('active');

                setTimeout(() => {
                    customAlert.classList.remove('alert', `alert-${type}`);
                    if (customStyle) {
                        customAlert.classList.remove(customStyle);
                    }

                    customAlert.innerHTML = '';
                }, 200);
            });
        }
    }
};
