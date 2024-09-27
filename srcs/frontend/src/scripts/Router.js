import { Home } from '../pages/Home/Home.js';
import { Login } from '../pages/Login/Login.js';
import { Play } from '../pages/Play/Play.js';
import { Signup } from '../pages/Signup/Signup.js';
import { NotFound } from '../pages/NotFound/NotFound.js';
import { Friends } from '../pages/Friends/Friends.js';
import { Profile } from '../pages/Profile/Profile.js';
import { Auth } from '../pages/Auth/Auth.js';
import { Pong } from '../pages/Pong/Pong.js';
import { Tournament } from '../pages/Tournament/Tournament.js';
import { Match } from '../pages/Match/Match.js';
import { staticComponentsRenderer } from './utils/StaticComponentsRenderer.js';
import { userSocket } from './utils/UserWebsocket.js';
import { handleResponse } from './utils/rtchatUtils.js';
import { Test } from '../pages/Test/Test.js';

class Router {
	constructor() {
		this.routes = {
			'/404': () => new NotFound(),
			'/': () => new Home(),
			'/login': () => new Login(),
			'/signup': () => new Signup(),
			'/play': () => new Play(),
			'/friends': () => new Friends(),
			'/friends/:filter': params => new Friends(params),
			'/profile': () => new Profile(),
			'/profile/:username': params => new Profile(params),
			'/auth': () => new Auth(),
			'/pong': () => new Pong(),
			'/tournament': () => new Tournament(),
			'/tournament/:tournamentId': params => new Tournament(params),
			'/match': () => new Match(),
			'/test': () => new Test(),
		};
		this.currentComponent = null;
		this.previousPath = null;
	}

	async navigateTo(url) {
		if (this.previousPath !== url) {
			window.history.pushState({}, "", url);

			const routeChangeEvent = new CustomEvent('routeChange', {
				detail: {
					path: url
				}
			});
			window.dispatchEvent(routeChangeEvent);

			this.router();
		}
	}


	async router() {
		const path = window.location.pathname;
		let matchedRoute = null;
		let matchedParams = {};

		Object.keys(this.routes).forEach(route => {
			const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '([^/]+)')}/?$`);
			const match = path.match(routeRegex);
			if (match) {
				matchedRoute = route;
				matchedParams = this.extractParams(route, path);
			}
		});


		const routeFactory = matchedRoute ? this.routes[matchedRoute] : this.routes['/404'];
		const isProtectedRoute = matchedRoute && matchedRoute !== "/login" && matchedRoute !== "/signup" && matchedRoute !== "/auth";

		const isAuthenticated = await this.checkAuthentication();

		if (isAuthenticated) {
			// if (matchedRoute === "/login" || matchedRoute === "/signup" || matchedRoute === "/auth") {
			// 	this.navigateTo("/play");
			// 	return;
			// }

			if (matchedRoute === "/login" || matchedRoute === "/signup" || matchedRoute === "/") {
					this.navigateTo("/play");
					return;
			}

			if (isProtectedRoute) {
				if (!userSocket.userSocket || userSocket.userSocket.readyState === WebSocket.CLOSED)
					userSocket.initWebSocket();
			}
		} else {
			if (isProtectedRoute) {
				this.navigateTo("/login");
				return;
			}
		}

		// await fetch("/api/2fa/check2fa/", {
		// 		method: "GET",
		// 		credentials: 'include',
		// 	})
		// 	.then(response => {
		// 		if (!response.ok) {
		// 			return response.json().then(errData => {
		// 				throw new Error(errData.error || `Response status: ${response.status}`);
		// 			});
		// 		}
		// 		return response.json();
		// 	})
		// 	.then(data => {
		// 		if (data["has2faEnabled"] == false) {
		// 			if (!isAuthenticated) {
		// 				this.navigateTo("/login");
		// 				return;
		// 			}
		// 		}
		// 	})

		if (this.currentComponent && this.previousPath !== path) {
			if (typeof this.currentComponent.destroy === 'function') {
				this.currentComponent.destroy();
			}
			this.currentComponent = null;
		}

		this.currentComponent = routeFactory(matchedParams);

		if (this.currentComponent) {
			await this.renderPage(this.currentComponent);
		} else {
			console.error('Route factory did not return a valid component:', routeFactory);
			document.getElementById('root').innerHTML = '<h1>Error: 404</h1>';
		}

		this.previousPath = path;
	}

	async checkAuthentication() {
		try {
			const response = await fetch('/api/check_auth', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include'
			});

			let is_auth = false;

			await handleResponse(response, data => {
				is_auth = data.authenticated;
			});

			return is_auth;

		} catch (error) {
			console.error("Error on checked authentication:", error);
			return false;
		}
	}

	extractParams(route, path) {
		const params = {};
		const routeParts = route.split('/');
		const pathParts = path.split('/');

		routeParts.forEach((part, index) => {
			if (part.startsWith(':')) {
				const paramName = part.slice(1);
				params[paramName] = pathParts[index];
			}
		});
		return params;
	}

	async renderPage(instance) {
		try {
			await staticComponentsRenderer.render();
			const html = await instance.render();
			document.getElementById('content').innerHTML = html;

			if (typeof instance.init === 'function') {
				await instance.init();
			}
		} catch (error) {
			console.error("Error rendering page:", error);
			document.getElementById('content').innerHTML = '<h1>Error rendering page.</h1>';
		}
	}
}

const routerInstance = new Router();
export default routerInstance;
export const navigateTo = routerInstance.navigateTo.bind(routerInstance);
