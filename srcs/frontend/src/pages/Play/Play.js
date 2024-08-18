import { Component } from '../../scripts/Component.js';

export class Play extends Component {
	constructor() {
		super('/pages/Play/play.html');
	}

	init() {
		this.setupEventListeners();
		//this.createTournament();
		//this.joinTournament();
	}

	setupEventListeners() {
		const oneVSoneBtn = document.getElementById("oneVSoneBtn");
		if (oneVSoneBtn) {
			oneVSoneBtn.addEventListener("click", () => {
				document.getElementById("btns").style.display = "none";
				document.getElementById("dropdownOne").style.display = "block";
			});
		}

		const tournamentBtn = document.getElementById("tournamentBtn");
		if (tournamentBtn) {
			tournamentBtn.addEventListener("click", () => {
				document.getElementById("btns").style.display = "none";
				document.getElementById("dropdownTwo").style.display = "block";
			});
		}

		const backOne = document.getElementById("backOne");
		if (backOne) {
			backOne.addEventListener("click", () => {
				document.getElementById("dropdownOne").style.display = "none";
				document.getElementById("btns").style.display = "block";
			});
		}

		const backTwo = document.getElementById("backTwo");
		if (backTwo) {
			backTwo.addEventListener("click", () => {
				document.getElementById("dropdownTwo").style.display = "none";
				document.getElementById("btns").style.display = "block";
			});
		}
	}
}
