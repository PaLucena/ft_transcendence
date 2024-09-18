import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { notificationsSocket  } from '../../scripts/utils/NotificationsWebsocket.js';

export class Play extends Component {
	constructor() {
		console.log('Play Constructor');
		super('/pages/Play/play.html');
	}

	destroy() {
		console.log("Play Custom destroy");
		this.removeAllEventListeners();
	}

	async init() {
		this.checkRunningTournaments()
		.then(tournamentId => {
			document.getElementById("tournamentBtn").innerHTML = tournamentId ? "<h1>Back to tournament</h1>" : "<h1>Tournament</h1>";
		})
		this.setupEventListeners();
		Navbar.focus();
	}

	setupEventListeners() {
		const	oneVSoneBtn = document.getElementById("oneVSoneBtn");
		this.addEventListener(oneVSoneBtn, "click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownOneVsOne").style.display = "block";
		});

		const	tournamentBtn = document.getElementById("tournamentBtn");
		this.addEventListener(tournamentBtn, "click", () => {

			this.checkRunningTournaments()
			.then(tournamentId => {
				if (tournamentId)
					navigateTo(`/tournament/${tournamentId}`);
				else {
					document.getElementById("btns").style.display = "none";
					document.getElementById("dropdownTournaments").style.display = "block";
					this.displayTournaments();
				}
			})
			.catch((error) => {
				customAlert('danger', `Error(checkRunningTournaments): ` + error.message, '');
			})
		});

		const	backOne = document.getElementById("backOne");
		this.addEventListener(backOne, "click", () => {
			document.getElementById("dropdownOneVsOne").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});

		const	backTwo = document.getElementById("backTwo");
		this.addEventListener(backTwo, "click", () => {
			document.getElementById("dropdownTournaments").style.display = "none";
			document.getElementById("btns").style.display = "block";
		});

		const	plusPublicBtn = document.getElementById("plusPublicBtn");
		this.addEventListener(plusPublicBtn, "click", () => {
			this.createTournament('public');
		});

		const	plusPrivateBtn = document.getElementById("plusPrivateBtn");
		this.addEventListener(plusPrivateBtn, "click", () => {
			this.createTournament('private');
		});

		// local
		const	localBtn = document.getElementById("localBtn");
		this.addEventListener(localBtn, "click", () => {
			this.playLocal();
		});

		// ai
		const	aiBtn = document.getElementById("aiBtn");
		this.addEventListener(aiBtn, "click", () => {
			this.playAi();
		});

		// online
		// const	remoteBtn = document.getElementById("remoteBtn");
		// this.addEventListener(remoteBtn, "click", () => {
		// 	this.playRemote();
		// });

		const	tournamentModalElement = document.getElementById("tournamentModal");
		new bootstrap.Modal(tournamentModalElement, {backdrop: false, keyboard: true});
		this.addEventListener(tournamentModalElement, 'shown.bs.modal', () => {
			document.getElementById('name-input').focus();
		});
	}

	async checkRunningTournaments() {
		try {
			const response = await fetch('/api/display_tournaments/', {
				method: "GET",
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			const data = await response.json();

			let	joinedTournament = data.public_tournaments.find(tournament =>
				tournament.players.some(players => players.nickname === 'you')
			);
			if (!joinedTournament) { // Verificamos si es undefined o null
				joinedTournament = data.private_tournaments.find(tournament =>
					tournament.players.some(players => players.nickname === 'you')
				);
			}
			return (joinedTournament ? joinedTournament.id : null);
		}
		catch (error) {
			console.log("ERROR", error)
			throw error;
		}
	}

	// local match
	playLocal() {
		fetch("/api/start_local_match/", {
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
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	// ai logic
	playAi() {
		fetch("/api/start_ai_match/", {
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
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	// remote logic
	playRemote() {
		fetch("/api/start_remote_match/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				player_2_username: player2Username, // the username of the invited player
			}),
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
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, '');
		})
	}

	createTournament(tournamentType) {
		const tournamentForm = document.getElementById("tournamentForm");

		this.addEventListener(tournamentForm, "submit", (event) => {
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
				publicContainer.innerHTML = '';

				for (let i = 0; displayPublic[i]; i++) {
					publicContainer.innerHTML += `<button class="display-tournament-item btn border-start-0 border-end-0 col-10 my-1 rounded" style="background-color: #ff6d3f;"><span class="tName">${displayPublic[i].name}</span> [${displayPublic[i].players.length}]</div>`;
				}
				this.joinTournament(displayPublic, 'public');
			}
			if (displayPrivate.length === 0)
				document.getElementById("privateTournamentDisplay").innerHTML = "No active tournaments";
			else {
				let	privateContainer = document.getElementById("privateTournamentDisplay");
				privateContainer.innerHTML = '';

				for (let i = 0; displayPrivate[i]; i++) {
					privateContainer.innerHTML += `<button class="display-tournament-item btn btn-success border-start-0 border-end-0 col-10 my-1 rounded"><span class="tName">${displayPrivate[i].name}</span> [${displayPrivate[i].players.length}]</div>`;
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

		joinBtns.forEach(joinBtn => {
			this.addEventListener(joinBtn, 'click', async () => {
				const	tournamentName = joinBtn.querySelector('.tName').innerHTML;

				const	tournamentData = allTournaments.find(object => object.name === tournamentName);
				if (!tournamentData)
					return ;

				const jsonData = await this.displayJoinModal(type);

				fetch(`/api/join_tournament/${tournamentData.id}/`, {
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
					navigateTo("/tournament/" + tournamentData.id);
				})
				.catch((error) => {
					customAlert('danger', `Error: ` + error.message, '');
				})
			});
		});
	}

	displayJoinModal(type) {
		if (type === 'private')
			document.querySelector('#codeInput').innerHTML = `<input type="text" class="form-control" id="code" name="code" placeholder="Invitation code" required>
																<label for="code">Invitation code</label>`;
		else
			document.querySelector('#codeInput').innerHTML = ``;

		const	joinModalElement = document.getElementById('joinModal');
		const	joinModal = new bootstrap.Modal(joinModalElement, {backdrop: false, keyboard: true});

		joinModal.show();

		return new Promise(resolve => {
			const joinForm = document.querySelector("#joinForm");

			this.addEventListener(joinForm, "submit", (event) => {
				event.preventDefault();

				const formData = new FormData(event.target);
				const jsonData = {};

				formData.forEach((value, key) => {
					jsonData[key] = value;
				});
				resolve(jsonData);
				joinModal.hide();
			});
		});
	}
}
