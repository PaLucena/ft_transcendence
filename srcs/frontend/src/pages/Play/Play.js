import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js';
import customAlert from '../../scripts/utils/customAlert.js';

export class Play extends Component {
	constructor() {
		super('/pages/Play/play.html');
	}

	init() {
		this.setupEventListeners();
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
			this.createTournament('PUBLIC');
		});

		const	plusPrivateBtn = document.getElementById("plusPrivateBtn");
		plusPrivateBtn.addEventListener("click", () => {
			this.createTournament('PRIVATE');
		});

		const	tournamentModalElement = document.getElementById("tournamentModal");
		new	bootstrap.Modal(tournamentModalElement, {backdrop: false, keyboard: true});
	}

	createTournament(tournamentType) {
		const tournamentForm = document.querySelector("#tournamentForm");

		tournamentForm.addEventListener("submit", (event) => {
			event.preventDefault();

			const formData = new FormData(event.target);
			const jsonData = {};

			formData.forEach((value, key) => {
				jsonData[key] = value;
			});
			jsonData["type"] = tournamentType;

			fetch("/api/create_tournament/", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(jsonData),
				credentials: 'include'
			})
			.then(response => {
				if (!response.ok) {
					return response.json().then(errData => {
						throw new Error(errData.error || `Response status: ${response.status}`);
					});
				}
				return response.json();
			})
			.then(data => {
				customAlert('success', data.message, '3000');
				this.joinTournament(jsonData["name"], tournamentType);
			})
			.catch((error) => {
				customAlert('danger', `Error: ` + error.message, '');
			})
		})
	}

	joinTournament(name, tournamentType) {

		console.log("Nombre del torneo: ", name);
		console.log("Tipo de torneo: ", tournamentType);

		fetch("/api/display_tournaments/", {
			method: "GET",
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		})
		.then(response => {
			console.log("Respuesta: ", response);
			if (!response.ok) {
				return response.json().then(errData => {
					throw new Error(errData.error || `Response status: ${response.status}`);
				});
			}
			return response.json();
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}
}
