
function initSignupForm() {
	const signupForm = document.querySelector("#signupForm");
	
	signupForm.addEventListener("submit", function(event) {
	event.preventDefault();

	console.log("CHECKPOINT");

	const formData = new FormData(event.target);
	let jsonData = {};
	
	formData.forEach((value, key) => {
		jsonData[key] = value;
	});

	fetch("/api/signup/", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(jsonData)
	})
		.then(response => {
			return response.json();
		})
		.then(data => {
			console.log("Success", data);
			navigateTo("/play");
		})
		.catch((error) => {
			console.error("Error: ", error);
		})
	})
}
