export function getCSRFToken(csrftoken) {
	var cookieValue = null;

	if (document.cookie && document.cookie != '') {
		var cookies = document.cookie.split(';');

		for (var i = 0; i < cookies.length; i++) {
			var cookie = jQuery.trim(cookies[i]);
			if (cookie.substring(0, 10) == (csrftoken + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(10));
				break;
			}
		}
	}
	console.log("CSRF: ", cookieValue)
	return cookieValue;
}