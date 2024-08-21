import { getHomeInstance } from '../pages/Home/Home.js';
import { getLoginInstance } from '../pages/Login/Login.js';
import { getPlayInstance } from '../pages/Play/Play.js'
import { getSignupInstance } from '../pages/Signup/Signup.js';
import { getNotFoundInstance } from '../pages/NotFound/NotFound.js';
import { getFriendsInstance } from '../pages/Friends/Friends.js';
import { getProfileInstance } from '../pages/Profile/Profile.js';
import { getAuthInstance } from '../pages/Auth/Auth.js';
import { getPongInstance } from '../pages/Pong/Pong.js';
import { staticComponentsRenderer } from './utils/StaticComponentsRenderer.js';
import { onlineSocket } from './utils/OnlineWebsocket.js';

export const routes = {
	'/404': getNotFoundInstance,
	'/': getHomeInstance,
	'/login': getLoginInstance,
	'/signup': getSignupInstance,
	'/play': getPlayInstance,
	'/friends': getFriendsInstance,
	'/profile': getProfileInstance,
	'/auth': getAuthInstance,
	'/pong': getPongInstance,
};

let currentComponent = null;

export default async function router() {
	const path = window.location.pathname;
	let matchedRoute = null;
	let matchedParams = {};
	let isAuthenticated = false;

	Object.keys(routes).forEach(route => {
		const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
		if (routeRegex.test(path)) {
			matchedRoute = route;
			matchedParams = extractParams(route, path);
		}
	});

	// console.log("Matched route:", matchedRoute);
	// console.log("Matched params:", matchedParams);

	const getRouteInstance = matchedRoute ? routes[matchedRoute] : routes['/404'];
    const newComponent = getRouteInstance(matchedParams);

	const isProtectedRoute = matchedRoute !== "/login" && matchedRoute !== "/signup" && matchedRoute !== "/auth";

	if (isProtectedRoute)
		isAuthenticated = await checkAuthentication();

	if (isAuthenticated && (!onlineSocket.onlineSocket || onlineSocket.onlineSocket.readyState === WebSocket.CLOSED) && isProtectedRoute)
		onlineSocket.initWebSocket();

	if (!isAuthenticated && isProtectedRoute) {
		navigateTo("/login");
		return;
	}

	if (currentComponent && typeof currentComponent.destroy === 'function') {
        currentComponent.destroy();
    }

	currentComponent = newComponent;

	if (currentComponent) {
        await renderPage(currentComponent, matchedParams);
    } else {
        console.error('RouteClass is not a constructor or is null:', getRouteInstance);
        document.getElementById('root').innerHTML = '<h1>Error: 404</h1>';
    }

	async function checkAuthentication() {
		try {
			const response = await fetch('api/check-auth/', {
				method: 'GET',
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				return data.authenticated;
			} else {
				return false;
			}
		} catch (error) {
			console.error("Error checking authentication:", error);
			return false;
		}
	}

	function extractParams(route, path) {
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

	async function renderPage(instance, params) {
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

export function navigateTo(url) {
	window.history.pushState({}, "", url);
	router();
}

export function navigateToOnBootup() {
	if (window.location.pathname === "/") {
		navigateTo("/login");
	} else {
		router();
	}
}
