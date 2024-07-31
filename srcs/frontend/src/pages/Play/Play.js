import { Page } from '../Page.js';
import { navigateTo } from '../../scripts/router/router.js'
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

export class Play extends Page {
	constructor() {
		super("/pages/Play/play.html")
	}

	async render() {
		return super.render();
	}

	async init() {
		await this.renderComponent(Navbar, 'navbar-placeholder');
		await this.renderComponent(ChatBtn, 'chatbtn-placeholder');
	}

	oneVSoneBtn() {
		document.getElementById("btns").style.display = "none";
		document.getElementById("dropdownOne").style.display = "block";
	}


	tournamentBtn() {
		document.getElementById("btns").style.display = "none";
		document.getElementById("dropdownTwo").style.display = "block";
	}


	hideDropdown() {
		document.getElementById("dropdownOne").style.display = "none";
		document.getElementById("dropdownTwo").style.display = "none";
		document.getElementById("btns").style.display = "block";
	}
}



