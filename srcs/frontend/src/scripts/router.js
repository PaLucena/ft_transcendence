import { Home } from '../pages/Home/Home.js';
import { Login } from '../pages/Login/Login.js';
import { Play } from '../pages/Play/Play.js';
import { Signup } from '../pages/Signup/Signup.js';
import { Chat } from '../pages/Chat/Chat.js';
import { NotFound } from '../pages/NotFound/NotFound.js';
import { Friends } from '../pages/Friends/Friends.js';
import { Profile } from '../pages/Profile/Profile.js';
import { Auth } from '../pages/Auth/Auth.js';
import renderStaticComponents from './utils/renderStaticComponents.js';


export const routes = {
	"/404": NotFound,
	"/": Home,
	"/login": Login,
	"/signup": Signup,
	"/play": Play,
	"/friends": Friends,
	"/profile": Profile,
	"/auth": Auth,
	"/chat": Chat,
	"/chat/:chatId": Chat,
};

export default async function router() {
	const path = window.location.pathname;
	let matchedRoute = null;
	let matchedParams = {};

	Object.keys(routes).forEach(route => {
		const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
		if (routeRegex.test(path)) {
			matchedRoute = route;
			matchedParams = extractParams(route, path);
		}
	});

	console.log("Matched route:", matchedRoute);
	console.log("Matched params:", matchedParams);

	const RouteClass = matchedRoute ? routes[matchedRoute] : routes["/404"];

	if (RouteClass) {
		await renderPage(RouteClass, matchedParams);
	} else {
		console.error('RouteClass is not a constructor or is null:', RouteClass);
		document.getElementById('root').innerHTML = '<h1>Error: 404</h1>';
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

	async function renderPage(RouteClass, params) {
		try {
			await renderStaticComponents();
			const page = new RouteClass(params);
			const html = await page.render();
			document.getElementById('content').innerHTML = html;

			if (typeof page.init === 'function') {
				await page.init();
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
