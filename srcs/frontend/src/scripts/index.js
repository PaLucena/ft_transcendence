import routerInstance, { navigateTo } from './Router.js';
import { initGlobalSockets } from './utils/globalSocketManager.js';
import { checkAuthentication } from './utils/rtchatUtils.js';

window.addEventListener("DOMContentLoaded", async () => {
	if (await checkAuthentication())
		initGlobalSockets();
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
