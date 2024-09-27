import { Component } from "../../scripts/Component.js";
import { handleResponse } from '../../scripts/utils/rtchatUtils.js'
import { userSocket } from '../../scripts/utils/UserWebsocket.js'
import { navigateTo } from "../../scripts/Router.js";


export class Navbar extends Component {
	constructor() {
		super('/components/Navbar/navbar.html');
		this.currentPathname = window.location.pathname;
	}

	init() {
		this.setupHistoryListeners();
		this.setupOnLogoutBtn();
		this.changeMenuButtonsActivity();
	}

	setupOnLogoutBtn () {
		const logoutBtn = document.getElementById('navbar_logout');

		if (logoutBtn) {
			this.addEventListener(logoutBtn, "click", async () => {
				try {
					const response = await fetch('/api/logout/', {
						method: "GET",
						credentials: 'include'
					})

					handleResponse(response, () => {
						userSocket.closeWebSocket();
						navigateTo("/login");
					});

				} catch(error) {
					console.log("Logout error: ", error);
				}
			});
		}
	}

	changeMenuButtonsActivity() {
		const currentPath = window.location.pathname.split('/')[1];

		const navBar = document.getElementById('navbar');

		if (navBar) {
			const menuItems = navBar.querySelectorAll('.icon');

			menuItems.forEach(item => {
				const route = item.getAttribute('data-route');

				if (route === currentPath) {
					item.classList.add('active');
				} else {
					item.classList.remove('active');
				}
			});
		} else {
			console.warn('navbar is not found.');

		}
	}

	setupHistoryListeners() {
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		history.pushState = (...args) => {
			originalPushState.apply(history, args);
			this.handlePathChange();
		};

		history.replaceState = (...args) => {
			originalReplaceState.apply(history, args);
			this.handlePathChange();
		};

		window.addEventListener('popstate', () => {
			this.handlePathChange();
		});
	}

	handlePathChange() {
		if (this.currentPathname !== window.location.pathname) {
			this.currentPathname = window.location.pathname;
			this.changeMenuButtonsActivity();
		}
	}
}
