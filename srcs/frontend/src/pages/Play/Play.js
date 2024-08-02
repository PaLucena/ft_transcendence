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
		this.oneVSoneBtn();
		this.tournamentBtn();
		this.hideDropdownOne();
		this.hideDropdownTwo();
	}

	oneVSoneBtn() {
		let oneVSone = document.getElementById("oneVSoneBtn");

		oneVSone.addEventListener("click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownOne").style.display = "block";
		});
	}


	tournamentBtn() {
		let tournament = document.getElementById("tournamentBtn");

		tournament.addEventListener("click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownTwo").style.display = "block";
		});
	}


	hideDropdownOne() {
		let backOne = document.getElementById("backOne");

		backOne.addEventListener("click", () => {
			document.getElementById("dropdownOne").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});
	}

	hideDropdownTwo() {
		let backTwo = document.getElementById("backTwo");

		backTwo.addEventListener("click", () => {
			document.getElementById("dropdownTwo").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});
	}
}
