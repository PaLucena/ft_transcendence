const socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

socket.onopen = function(e) {
	console.log("[open] Connection established");
	socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
	setInterval(null, 3600)
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

socket.onerror = function(error) {
	console.error(`[error] ${error.message}`);
};


document.addEventListener("DOMContentLoaded", () => {
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
		.then(response => {return (response.json)})
		.then(data => {
			console.log("Success", data);
		})
		.catch((error) => {
			console.error("Error: ", error);
		})
	})
})

function	forgotPassword() {
	alert("Tough luck!");
}

function	goToSignUp() {
	console.log("Changing to Sign Up"); // debug
	window.location.href = "pages/signup.html";
}
