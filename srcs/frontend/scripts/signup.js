
function initSignupForm() {
	const signupForm = document.querySelector("#signupForm");
	
	signupForm.addEventListener("submit", function(event) {
	event.preventDefault();

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
			if (response.status === 201)
				return response.json();
			else { // Aqui tengo que manejar los códigos de error
				return response.json().then(errData => {
					console.error("Error ${response.status}:", errData);
					throw new Error("Error ${response.status}");
				});
			}
		})
		.then(data => {
			console.log("Success", data);
			localStorage.setItem("token", data.token);
			navigateTo("/play");
		})
		.catch((error) => {
			console.error("Error: ", error);
		})
	})
}
