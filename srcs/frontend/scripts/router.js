const route = (event) => {
	event = event || window.event;
	console.log(event);
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	handleLocation();
};

const routes = {
	404: "pages/404.html",
	"/": "index.html",
	"/login": "pages/login.html",
	"/signup": "pages/signup.html",
	"/play": "pages/play.html",
	"/friends": "pages/friends.html",
	"/profile": "pages/profile.html",
	"/chat": "pages/chat.html",
	"/auth": "pages/auth.html",
};

const handleLocation = async () => {
	const path = window.location.pathname;
	const route = routes[path] || routes [404];
	console.log("fetching to", route);
	const html = await fetch(route).then((data) => data.text());
	document.getElementById("container").innerHTML = html;

	if (path === "/signup")
		initSignupForm();
	else if (path === "/login")
		initLoginForm();
	else if (path === "/play" || path === "/profile" || path === "/friends") {
		applyNavbar();
		applyChat();
	}
	else if (path === "/auth") {
		getApiToken();
	}
	// else if (path === "/chat") {
	// 	initChat();
	// }
}

window.onpopstate = handleLocation;

window.route = route;

const navigateTo = (url) => {
	window.history.pushState({}, "", url);
	handleLocation();
}

const navigateToOnBootup = () => {
	if (window.location.pathname === "/") {
		navigateTo("/login");
	}
	else
		handleLocation();
}

navigateToOnBootup();
