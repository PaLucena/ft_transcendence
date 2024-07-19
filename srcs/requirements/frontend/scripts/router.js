const route = (event) => {
	event = event || window.event;
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	handleLocation();
};

const routes = {
	404: "pages/404.html",
	"/": "index.html",
	"/signup": "pages/signup.html",
	"/play": "pages/play.html",
	"/profile": "pages/profile.html",
};

const handleLocation = async () => {
	const path = window.location.pathname;
	const route = routes[path] || routes [404];
	console.log("fetching to", route)
	const html = await fetch(route).then((data) => data.text());
	document.getElementById("container").innerHTML = html;
}

window.onpopstate = handleLocation;

window.route = route;

handleLocation();

// Inicializar el formulario de registro
function initSignupForm() {
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
}


/* function loadPage(page) {
	fetch(`pages/${page}.html`)
		.then(response => response.text())
		.then(data => {
			document.getElementById('placeholder').innerHTML = data;
			// Guardar la página actual en localStorage
			localStorage.setItem('currentPage', page);
		});
}

document.addEventListener('DOMContentLoaded', () => {
	// Verificar si hay una página guardada en localStorage
	const savedPage = localStorage.getItem('currentPage') || 'login';
	loadPage(savedPage);
});

// Ejemplos de funciones para cargar diferentes páginas
function signupPage() {
	loadPage('signup');
}

function loginPage() {
	loadPage('login');
} */

/* fetch('pages/login.html')
	.then(response => response.text())
	.then(data => {
		document.getElementById('placeholder').innerHTML = data;
	});

function	signupPage() {
	fetch('pages/signup.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('placeholder').innerHTML = data;
		});
} */
