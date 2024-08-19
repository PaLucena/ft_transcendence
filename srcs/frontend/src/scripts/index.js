import router, { navigateTo, navigateToOnBootup } from './router.js';

window.addEventListener("DOMContentLoaded", () => {
	navigateToOnBootup();
});

window.addEventListener("popstate", () => {
	console.log("popstate event triggered");
	router();
});

document.addEventListener("click", (event) => {
	const clickableElement = event.target.closest("a, button");

	if (clickableElement && clickableElement.hasAttribute("href")) {
		event.preventDefault();
		console.log("Navigating to:", clickableElement.getAttribute("href"));
		navigateTo(clickableElement.getAttribute("href"));
	}
});
