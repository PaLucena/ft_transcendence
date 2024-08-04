import router, { navigateTo, navigateToOnBootup } from './router.js';

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", () => {
	console.log("popstate event triggered");
	router();
});

document.addEventListener("click", (event) => {
	console.log("Clicked element:", event.target);
	const anchor = event.target.closest("a");
	if (anchor) {
		event.preventDefault();
		console.log("Navigating to:", anchor.href);
		navigateTo(anchor.href);
	}
});
