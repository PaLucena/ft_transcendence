document.addEventListener("DOMContentLoaded", function() {
	fetch('../components/navbar/navbar.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('navbar-placeholder').innerHTML = data;
		});
});
