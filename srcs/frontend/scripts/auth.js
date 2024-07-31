function	intraLogin() {
	window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6&redirect_uri=https%3A%2F%2Flocalhost%3A8080%2Fauth&response_type=code"
}

function getApiToken() {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');

	console.log("code: ", code)

	const response = fetch("/api/42api-login/", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"api-code": code,
		}),
	})
	.then(response => {
		return response.json()
	})
	.then(data => {
		console.log(data)
		navigateTo("/play");
	})
}
