/* (function bootup() {
	navigateToOnBootup();
})(); */

const route = (event) => {
	event = event || window.event;
	console.log(event);
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	handleLocation();
};

const routes = {
	404: "pages/404.html",
	"/": "index.html",
	"/login": "pages/login.html",
	"/signup": "pages/signup.html",
	"/play": "pages/play.html",
	"/profile": "pages/profile.html",
};

const handleLocation = async () => {
	const path = window.location.pathname;
	const route = routes[path] || routes [404];
	console.log("fetching to", route);
	const html = await fetch(route).then((data) => data.text());
	document.getElementById("container").innerHTML = html;

	if (path === "/signup") {
		initSignupForm();
	}
	else if (path === "/login") {
		initLoginForm();
	}
}

window.onpopstate = handleLocation;

window.route = route;

const navigateTo = (url) => {
	window.history.pushState({}, "", url);
	handleLocation();
}

const navigateToOnBootup = () => {
	// Verificar si la página se ha cargado por primera vez
	if (window.location.pathname === "/") {
		navigateTo("/login");
	}
	else
		handleLocation();
}

navigateToOnBootup();

/* 
renderInitialPage = () => {
	navigateTo("/login");
}
 */
// Inicializar el formulario de registro
/* function initSignupForm() {
	const signupForm = document.querySelector("#signupForm");

	if (signupForm) {
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
			.then(response => response.json())
			.then(data => {
				console.log("Success", data);
				// Si el registro es exitoso, redirigir a la página de login u otra página
				loginPage();
			})
			.catch((error) => {
				console.error("Error: ", error);
			});
		});
	}
} */
