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
		let navItems = document.querySelectorAll('[id^="navItem"]');
		navItems.forEach(navItem => {
			navItem.style.border = "";
		});
		document.getElementById("navItemPlay").style.border = "2px solid #edeef0";

		const	oneVSoneBtn = document.getElementById("oneVSoneBtn");
		oneVSoneBtn.addEventListener("click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownOneVsOne").style.display = "block";
		});

		const	tournamentBtn = document.getElementById("tournamentBtn");
		tournamentBtn.addEventListener("click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownTournaments").style.display = "block";
		});

		const	backOne = document.getElementById("backOne");
		backOne.addEventListener("click", () => {
			document.getElementById("dropdownOneVsOne").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});

		const	backTwo = document.getElementById("backTwo");
		backTwo.addEventListener("click", () => {
			document.getElementById("dropdownTournaments").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});

		const	plusPublicBtn = document.getElementById("plusPublicBtn");
		plusPublicBtn.addEventListener("click", () => {
			console.log("Public");
			document.getElementById("dropdownCreateTournament").style.display = "block";
			document.getElementById("dropdownTournaments").style.display = "none";
		});

		const	plusPrivateBtn = document.getElementById("plusPrivateBtn");
		plusPrivateBtn.addEventListener("click", () => {
			console.log("Private");
			document.getElementById("dropdownCreateTournament").style.display = "block";
			document.getElementById("dropdownTournaments").style.display = "none";
		});

		const	backThree = document.getElementById("backThree");
		backThree.addEventListener("click", () => {
			document.getElementById("dropdownTournaments").style.display = "block";
			document.getElementById("dropdownCreateTournament").style.display = "none";
		});
	}
}
