import { Page } from './Page.js';

export class Auth extends Page {
	constructor() {
		super("/pages/auth.html")
	}

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		this.getApiToken()
	}

	getApiToken() {
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
}
