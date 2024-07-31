function	enable2fa() {
	const response = fetch("/api/2fa/enable2fa/", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			"user": "ealgar-c",
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