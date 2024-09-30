import routerInstance, { navigateTo } from './Router.js';


window.addEventListener("DOMContentLoaded", () => {
	routerInstance.router();
});

window.addEventListener("popstate", () => {
	routerInstance.router();
});

document.addEventListener("click", (event) => {
	const clickableElement = event.target.closest("a, button");

	if (clickableElement && clickableElement.hasAttribute("href")&& clickableElement.id !== 'rick') {
		event.preventDefault();
		navigateTo(clickableElement.getAttribute("href"));
	}
});
