import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/Router.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { initGlobalSockets } from "../../scripts/utils/globalSocketManager.js";

export class Auth extends Component {
	constructor() {
		super("/pages/Auth/auth.html")
	}

	init() {
		this.getApiToken()
	}

	getApiToken() {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		if (code === null) {
			navigateTo("/login");
			return ;
		}
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
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json()
		})
		.then(data => {
			initGlobalSockets();
			navigateTo("/play");
		})
		.catch(error => {
			customAlert('danger', `Error: ${error.message}`, 5000);
			navigateTo("/login")
		});
	}
}
