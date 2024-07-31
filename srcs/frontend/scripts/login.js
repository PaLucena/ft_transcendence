
function	getBase64Img(url) {
	fetch(url, {
		
	})
}

function initializeWebSocket() {
	const socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

	socket.onopen = function(e) {
		console.log("[open] Connection established");
		socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
		//setInterval(null, 3600)
	};
	
	socket.onmessage = function(event) {
		console.log(`[message] Data received from server: ${event.data}`);
	};
	
	socket.onclose = function(event) {
		if (event.wasClean) {
			console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.error('[close] Connection died');
		}
	};
}

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
			body: JSON.stringify(jsonData),
			credentials: 'include'
		})
		.then(response => {
			if (response.status === 200) {
				initializeWebSocket();
				return response.json();
			}
			else { //TODO: Aqui tengo que manejar los códigos de error
				return response.json().then(errData => {
					document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
					throw new Error("Error ${response.status}");
				});
			}
		})
		.then(data => {
			console.log("Login successful", data);
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