import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/Router.js';

export class Auth extends Component {
	constructor() {
		console.log('Auth Constructor');
		super("/pages/Auth/auth.html")
	}

	init() {
		this.getApiToken()
	}

	getApiToken() {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		console.log("code: ", code)

		fetch("/api/42api-login/", {
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
			navigateTo("/play");
		})
	}
}
