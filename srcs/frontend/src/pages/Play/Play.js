import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/router.js';
import customAlert from '../../scripts/utils/customAlert.js';

export class Play extends Component {
	constructor() {
		super('/pages/Play/play.html');
	}

	init() {
		this.setupEventListeners();
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
			this.displayTournaments();
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
			this.createTournament('public');
		});

		const	plusPrivateBtn = document.getElementById("plusPrivateBtn");
		plusPrivateBtn.addEventListener("click", () => {
			this.createTournament('private');
		});

		const	tournamentModalElement = document.getElementById("tournamentModal");
		new bootstrap.Modal(tournamentModalElement, {backdrop: false, keyboard: true});
		tournamentModalElement.addEventListener('shown.bs.modal', () => {
			document.getElementById('name-input').focus();
		});
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
		fetch("/api/display_tournaments/", {
			method: "GET",
			headers: {
				'Content-Type': 'application/json'
			},
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
			if (tournamentType === 'private') {
				const	tournamentData = data.private_tournaments.find(object => object.name === name);
				this.getTournamentCode(tournamentData);
				navigateTo("/tournament/" + tournamentData.id)
			}
			else {
				const	tournamentData = data.public_tournaments.find(object => object.name === name);
				navigateTo("/tournament/" + tournamentData.id)
			}
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	getTournamentCode(tournamentData) {
		console.log("Falta hacer el fetch al get_code(request, tournament_id");
	}

	displayTournaments() {
		fetch("/api/display_tournaments/", {
			method: "GET",
			headers: {
				'Content-Type': 'application/json'
			},
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
			const	displayPublic = data.public_tournaments;
			const	displayPrivate = data.private_tournaments;
			if (displayPublic.length === 0)
				document.getElementById("publicTournamentDisplay").innerHTML = "No active tournaments";
			else {
				let	publicContainer = document.getElementById("publicTournamentDisplay");
				for (let i = 0; displayPublic[i]; i++) {
					publicContainer.innerHTML += `<button class="btn btn-success display-tournament-item col-10 my-1 rounded">${displayPublic[i].name} ${displayPublic[i].players.length}</div>`;
				}
			}
			if (displayPrivate.length === 0)
				document.getElementById("privateTournamentDisplay").innerHTML = "No active tournaments";
			else {
				let	privateContainer = document.getElementById("privateTournamentDisplay");
				for (let i = 0; displayPrivate[i]; i++) {
					privateContainer.innerHTML += `<button class="btn btn-success display-tournament-item col-10 my-1 rounded">${displayPublic[i].name} ${displayPublic[i].players.length}</div>`;
				}
			}
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}
}
