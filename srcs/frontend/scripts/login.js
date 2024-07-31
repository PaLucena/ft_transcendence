function	initLoginForm() {
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
			else {
				return response.json().then(errData => {
					document.getElementById("errorPlaceholder").innerHTML = "Error: " + errData.error;
					throw new Error(errData.error);
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
