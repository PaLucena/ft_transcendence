import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/router.js';

export class Auth extends Component {
	constructor() {
		super("/pages/Auth/auth.html")
	}

	async init() {
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
