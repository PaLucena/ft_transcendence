import { Page } from '../Page.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

export class Friends extends Page {
	constructor() {
		super("/pages/Friends/friends.html")
	}

	async render() {
		return super.render();
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
	}
}
