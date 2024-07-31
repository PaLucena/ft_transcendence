import { Page } from './Page.js';

export class Friends extends Page {
	constructor() {
		super("/pages/friends.html")
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
