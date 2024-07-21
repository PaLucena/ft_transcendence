document.addEventListener("DOMContentLoaded", function() {
	fetch('pages/login.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('placeholder').innerHTML = data;
		});
});
