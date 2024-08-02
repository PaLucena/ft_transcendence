import { Home } from '../../pages/Home/Home.js';
import { Login } from '../../../pages/Login/Login.js';
import { Play } from '../../../pages/Play/Play.js';
import { Signup } from '../../../pages/Signup/Signup.js';
import { Chat } from '../../../pages/Chat/Chat.js';
import { NotFound } from '../../pages/NotFound/NotFound.js';
import { Friends } from '../../../pages/Friends/Friends.js';
import { Profile } from '../../../pages/Profile/Profile.js';
import { Auth } from '../../../pages/Auth/Auth.js';

const routes = {
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

export async function router() {
	const path = window.location.pathname;

	let matchedRoute = null;
	let matchedParams = {};

	Object.keys(routes).forEach(route => {
	const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`);
	if (routeRegex.test(path)) {
		matchedRoute = route;
		matchedParams = extractParams(route, path);
	}
	});

	console.log(matchedRoute);
	console.log(matchedParams);
	const RouteClass = matchedRoute ? routes[matchedRoute] : routes["/404"];
	const page = new RouteClass(matchedParams);
	const html = await page.render();
	document.getElementById("container").innerHTML = html;

	page.init();
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

export function navigateTo(url) {
	window.history.pushState({}, "", url);
	router();
}

export function navigateToOnBootup() {
	if (window.location.pathname === "/")
		navigateTo("/login");
	else
		router();
}
