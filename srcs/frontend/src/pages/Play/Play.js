import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import customAlert from '../../scripts/utils/customAlert.js';

export class Play extends Component {
	constructor(params = {}) {
		console.log('Play Constructor');
		super('/pages/Play/play.html', params);
	}

	destroy() {
		console.log("Play Custom destroy");
		this.removeAllEventListeners();
    }

	init() {
		console.log("Play Params!!", this.params);
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
				this.joinTournamentAsCreator(jsonData["name"], tournamentType);
			})
			.catch((error) => {
				customAlert('danger', `Error: ` + error.message, '');
			})
		})
	}

	joinTournamentAsCreator(name, tournamentType) {
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
				this.getTournamentCode(tournamentData.id);
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

	getTournamentCode(tournamentId) {
		console.log("Falta hacer el fetch al get_code(request, tournament_id");
		fetch("/api/get_code/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: tournamentId,
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
			console.log(data);
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
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
					publicContainer.innerHTML += `<button class="display-tournament-item btn btn-info border-start-0 border-end-0 col-10 my-1 rounded"><span class="tName">${displayPublic[i].name}</span> [${displayPublic[i].players.length}]</div>`;
				}
				this.joinTournament(displayPublic, 'public');
			}
			if (displayPrivate.length === 0)
				document.getElementById("privateTournamentDisplay").innerHTML = "No active tournaments";
			else {
				let	privateContainer = document.getElementById("privateTournamentDisplay");
				for (let i = 0; displayPrivate[i]; i++) {
					privateContainer.innerHTML += `<button class="display-tournament-item btn btn-info border-start-0 border-end-0 col-10 my-1 rounded"><span class="tName">${displayPrivate[i].name}</span> [${displayPrivate[i].players.length}]</div>`;
				}
				this.joinTournament(displayPrivate, 'private');
			}
		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	joinTournament(allTournaments, type) {
		const	joinBtns = document.querySelectorAll('.display-tournament-item');
		console.log("hola");

		joinBtns.forEach(joinBtn => {
			joinBtn.addEventListener('click', () => {
				const	tournamentName = joinBtn.querySelector('.tName').innerHTML;

				const	tournamentData = allTournaments.find(object => object.name === tournamentName);
				if (!tournamentData)
					return ;
				console.log("Tournament data: ", tournamentData);
				
				fetch("/api/join_tournament/" + tournamentData.id, {
					method: "POST",
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
					customAlert('success', data.message, '3000');
					console.log(data);
				})
				.catch((error) => {
					customAlert('danger', `Error: ` + error.message, '');
				})
			});
		});
	}
}

