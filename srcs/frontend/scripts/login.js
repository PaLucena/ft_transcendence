function initLoginForm() {
	const loginForm = document.querySelector("#loginForm");

	loginForm.addEventListener("submit", function(event) {
		event.preventDefault();

		const formData = new FormData(event.target);
		const jsonData = {};

		formData.forEach((value, key) => {
			jsonData[key] = value;
		});

		fetch("/api/login/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonData)
		})
		.then(response => {
			if (response.status === 200)
				return response.json();
			else { // Aqui tengo que manejar los códigos de error
				return response.json().then(errData => {
					console.error("Error ${response.status}:", errData);
					throw new Error("Error ${response.status}");
				});
			}
		})
		.then(data => {
			console.log("Login successful", data);
			//sessionStorage.setItem("token", data.token);
			navigateTo("/play");
		})
		.catch((error) => {
			console.error("Login error: ", error);
		})
	})
}

// function getCSRFToken(csrftoken) {
// 	var cookieValue = null;
// 	if (document.cookie && document.cookie != '') {
// 		var cookies = document.cookie.split(';');
// 		for (var i = 0; i < cookies.length; i++) {
// 			var cookie = jQuery.trim(cookies[i]);
// 			if (cookie.substring(0, 10) == (csrftoken + '=')) {
// 				cookieValue = decodeURIComponent(cookie.substring(10));
// 				break;
// 			}
// 		}
// 	}
// 	return cookieValue;
// }