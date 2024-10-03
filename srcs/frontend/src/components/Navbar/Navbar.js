import { Component } from "../../scripts/Component.js";
import { handleResponse } from '../../scripts/utils/rtchatUtils.js'
import { navigateTo } from "../../scripts/Router.js";
import { closeGlobalSockets } from "../../scripts/utils/globalSocketManager.js";


export class Navbar extends Component {
	constructor() {
		super('/components/Navbar/navbar.html');
		this.currentPathname = window.location.pathname;

		this.originalPushState = history.pushState;
		this.originalReplaceState = history.replaceState;
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
						closeGlobalSockets();
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
		history.pushState = (...args) => {
			this.originalPushState.apply(history, args);
			this.handlePathChange();
		};

		history.replaceState = (...args) => {
			this.originalReplaceState.apply(history, args);
			this.handlePathChange();
		};
	}

	handlePathChange() {
		if (this.currentPathname !== window.location.pathname) {
			this.currentPathname = window.location.pathname;

			this.changeMenuButtonsActivity();
		}
	}

    destroy() {
		history.pushState = this.originalPushState;
		history.replaceState = this.originalReplaceState;

		this.removeAllEventListeners();
    }
}
