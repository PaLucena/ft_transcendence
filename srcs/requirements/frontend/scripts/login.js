
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
