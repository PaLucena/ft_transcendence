
document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("loginForm");

	loginForm.addEventListener("submit", function(event) {
		event.preventDefault();

		const formData = new FormData(loginForm);
		const jsonData = {};

		formData.forEach((value, key) => {
			jsonData[key] = value;
		});

		fetch("http://0.0.0.0:8000/login", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonData)
		})
		.then(response => response.json)
		.then(data => {
			console.log("Success", data);
		})
		.catch((error) => {
			console.error("Error: ", error);
		})
	})
})

function	login() {
	alert("Work in progress...");
}

function	forgotPassword() {
	alert("Tough luck!");
}

function	goToSignUp() {
	console.log("Changing to Sign Up"); // debug
	window.location.href = "pages/signup.html";
}

function	createAccount() {
	alert("Work in progress...");
}
