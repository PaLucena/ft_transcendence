import routerInstance, { navigateTo, navigateToOnBootup } from './Router.js';

window.addEventListener("DOMContentLoaded", () => {
	navigateToOnBootup();
});

window.addEventListener("popstate", () => {
	// console.log("popstate event triggered");
	routerInstance.router();
});

document.addEventListener("click", (event) => {
	const clickableElement = event.target.closest("a, button");

	if (clickableElement && clickableElement.hasAttribute("href")) {
		event.preventDefault();
		navigateTo(clickableElement.getAttribute("href"));
	}
});
