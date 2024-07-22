
function initLoginForm() {
	const loginForm = document.querySelector("#loginForm");

	loginForm.addEventListener("submit", function(event) {
		event.preventDefault();

		const formData = new FormData(event.target);
		const jsonData = {};

		formData.forEach((value, key) => {
			jsonData[key] = value;
		});

		fetch("/login/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(jsonData)
		})
		.then(response => response.json)
		.then(data => {
			console.log("Login successful", data);
			navigateTo("/play");
		})
		.catch((error) => {
			console.error("Login error: ", error);
		})
	})
}
