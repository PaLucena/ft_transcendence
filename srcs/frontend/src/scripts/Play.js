import { Page } from './Page.js';
import { navigateTo } from './index.js'

export class Play extends Page {
	constructor() {
		super("/pages/play.html")
	}

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		applyNavbar();
		applyChat();
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



