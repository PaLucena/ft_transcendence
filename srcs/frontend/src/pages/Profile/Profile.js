import { Page } from '../Page.js';

export class Profile extends Page {
	constructor() {
		super("/pages/Profile/profile.html")
	}

	async render() {
		return await super.render();
	}

	init() {
		applyNavbar();
		applyChat();
	}
}
