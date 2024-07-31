import { Page } from './Page.js';

export class Profile extends Page {
	constructor() {
		super("/pages/profile.html")
	}

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		applyNavbar();
		applyChat();
	}
}
