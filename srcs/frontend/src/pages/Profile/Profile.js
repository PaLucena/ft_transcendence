import { Page } from '../Page.js';
import { Navbar } from '../../components/Navbar/Navbar.js'
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js'

export class Profile extends Page {
	constructor() {
		super("./profile.html")
	}

	async render() {
		return "<h1>Profile Page</h1>";
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
	}
}
