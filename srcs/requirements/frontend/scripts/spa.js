function loadPage(page) {
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
}

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
