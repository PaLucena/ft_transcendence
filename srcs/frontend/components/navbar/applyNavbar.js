
function applyNavbar() {
	fetch('components/navbar/navbar.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('navbar-placeholder').innerHTML = data;
		})
		.catch(error => console.error('Error al cargar el contenido:', error));
}
