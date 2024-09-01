import { getCSRFToken } from '../../scripts/utils/csrf.js'
import customAlert from '../../scripts/utils/customAlert.js';

export function showQRmodal(qrpath){
	const ModalElement = document.getElementById('imageModal');
	const overlayElement = document.getElementById('customOverlay');
	var qrmodal = new bootstrap.Modal(ModalElement, {backdrop: false, keyboard: false})
	const csrftoken = getCSRFToken('csrftoken');
	console.log(qrpath)
	fetch("/api/media/" + qrpath, {
		method: "GET",
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken
		}
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
		qrmodal.show()
	})
	.catch(error => {
		customAlert('danger', `Error: ${error.message}`, '');
	});
}