import { Component } from '../../scripts/Component.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

export class Friends extends Component {
	constructor() {
		super('/pages/Friends/friends.html')
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
	}
}
