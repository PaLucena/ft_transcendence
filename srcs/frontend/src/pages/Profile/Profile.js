import { Page } from '../Page.js';
import { Navbar } from '../../components/Navbar/Navbar.js'
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js'

export class Profile extends Page {
	constructor() {
		super("/pages/Profile/profile.html")
	}

	async render() {
		return await super.render();
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
	}
}
