import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { tournamentSocket } from '../../scripts/utils/TournamentWebsocket.js';
import { pongTournamentSocket } from '../Tournament/PongTournamentSocket.js';

export class Play extends Component {
	constructor() {
		super('/pages/Play/play.html');
		pongTournamentSocket.initWebSocket();
	}


	destroy() {
		tournamentSocket.closeWebSocket();
		this.removeAllEventListeners();
	}

	async init() {
		this.setupEventListeners();
		this.setupTournamentJoin();
		setTimeout(() => languageSelector.updateLanguage(), 0);
	}

	setupEventListeners() {
		const	oneVSoneBtn = document.getElementById("oneVSoneBtn");
		this.addEventListener(oneVSoneBtn, "click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownOneVsOne").style.display = "block";
		});

		const	tournamentBtn = document.getElementById("tournamentBtn");
		this.addEventListener(tournamentBtn, "click", () => {
			document.getElementById("btns").style.display = "none";
			document.getElementById("dropdownTournaments").style.display = "block";
		});


		// DEBUG  ---------------------------------------------------------------------------
		const testBtn = document.getElementById("testBtn");
		testBtn.innerHTML = "Test Button";
		this.addEventListener(testBtn, "click", async () => {
			pongTournamentSocket.t_socket.send(JSON.stringify({
				'type': 'clean_tournaments',
			}));
		});
		// ----------------------------------------------------------------------------------


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

		const	tournamentModalElement = document.getElementById("tournamentModal");
		new bootstrap.Modal(tournamentModalElement, {backdrop: false, keyboard: true});
		this.addEventListener(tournamentModalElement, 'shown.bs.modal', () => {
			document.getElementById('tournament-name').focus();
		});

		// close tournament modal
		const closeTournamentBtn = document.querySelector('#closeTournamentBtn');
		this.addEventListener(closeTournamentBtn, 'click', () => {
			document.getElementById("tournamentForm").reset();
		});

		// close join modal
		const closeJoinBtn = document.querySelector('#closeJoinBtn');
		this.addEventListener(closeJoinBtn, 'click', () => {
			document.getElementById("joinForm").reset();
		});
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
			customAlert('success', data.message, 3000);
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, 5000);
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
			customAlert('success', data.message, 3000);
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, 5000);
		})
	}

	playRemote() {
		fetch("/api/start_remote_match/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				player_2_username: player2Username,
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
			customAlert('success', data.message, 3000);
			navigateTo("/pong");

		})
		.catch((error) => {
			customAlert('danger', `Error: ` + error.message, 5000);
		})
	}


	createTournament(tournamentType) {
		const closeModal = document.getElementsByClassName("btn-close")[0];
		const tittleModal = document.getElementsByClassName("modal-title")[0];
		const tournamentForm = document.getElementById("tournamentForm");
		const tournamentName = document.getElementById("tournament-name");

		console.log("Tournament type:", tournamentType);

		tournamentForm.removeEventListener('submit', this.handleTournamentSubmit);
		tittleModal.innerHTML = `New ${tournamentType} tournament`;
		tournamentName.value = '';

		if (tournamentType === 'private') {
			document.querySelector('#passwordInput').innerHTML = `
				<input type="text" class="form-control" id="code" name="code" placeholder="Invitation code" required>
				<label data-i18n="invitation-code" for="code"></label>`;
        	setTimeout(() => languageSelector.updateLanguage(), 0);
		}
		else
			document.querySelector('#passwordInput').innerHTML = '';

		this.handleTournamentSubmit = async (event) => {
			event.preventDefault();
			const formData = new FormData(event.target);

			try {
				let is_private = tournamentType === 'private';
				await pongTournamentSocket.t_socket.send(JSON.stringify({
					type: 'create_tournament',
					name: formData.get("name"),
					is_private,
					password: is_private ? formData.get('code') : null,
				}));
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
			closeModal.click();
		};
		this.addEventListener(tournamentForm, "submit", this.handleTournamentSubmit);
	}


	static displayTournaments(public_tournaments, private_tournaments, player_id) {
		if (public_tournaments.length === 0)
			document.getElementById("publicTournamentDisplay").innerHTML = "No active tournaments";
		else {
			let	publicContainer = document.getElementById("publicTournamentDisplay");
			publicContainer.innerHTML = '';

			for (let i = 0; i < public_tournaments.length; i++) {
				let isPlayer = public_tournaments[i].players.includes(player_id);
				let tournamentName = isPlayer
					? `⭐ ${public_tournaments[i].name} ⭐`
					: public_tournaments[i].name;
				publicContainer.innerHTML +=
					`<button
						class="tournament-item-btn display-tournament-item btn border-start-0
							border-end-0 col-10 my-1 rounded"
						style="background-color: #ff6d3f;"
						data-tournament-id="${public_tournaments[i].id}"
						data-tournament-name="${public_tournaments[i].name}"
						data-tournament-type="public"
						data-tournament-creator="${public_tournaments[i].participants_data[0].user_name}"
					>
						<span class="tName">
							${tournamentName}
						</span>
						[${public_tournaments[i].participants.length}]
					</button>`;
			}
		}
		if (private_tournaments.length === 0)
			document.getElementById("privateTournamentDisplay").innerHTML = "No active tournaments";
		else {
			let	privateContainer = document.getElementById("privateTournamentDisplay");
			privateContainer.innerHTML = '';

			for (let i = 0; i < private_tournaments.length; i++) {
				let isPlayer = private_tournaments[i].players.includes(player_id);
				let tournamentName = isPlayer
					? `⭐ ${private_tournaments[i].name} ⭐`
					: private_tournaments[i].name;
				privateContainer.innerHTML +=
					`<button
						class="tournament-item-btn display-tournament-item
							btn btn-success border-start-0 border-end-0
							col-10 my-1 rounded"
						style="background-color: #ff6d3f;"
						data-tournament-id="${private_tournaments[i].id}"
						data-tournament-name="${private_tournaments[i].name}"
						data-tournament-type="private"
						data-tournament-creator="${private_tournaments[i].participants_data[0].user_name}"
					>
						<span class="tName">
							${tournamentName}
						</span>
						[${private_tournaments[i].participants.length}]
					</button>`;
			}
		}
	}

	setupTournamentJoin() {
		const tournamentsContainer = document.getElementById("dropdownTournaments");

		if (tournamentsContainer) {
			this.addEventListener(tournamentsContainer, "click", (event) => {
				let closestElement = event.target.closest(".tournament-item-btn");

				if (closestElement) {
					let tournamentId = closestElement.getAttribute("data-tournament-id");
					let tournamentName = closestElement.getAttribute("data-tournament-name");
					let tournamentType = closestElement.getAttribute("data-tournament-type");
					let tournamentCreator = closestElement.getAttribute("data-tournament-creator");

					this.displayJoinModal(tournamentId, tournamentType, tournamentName, tournamentCreator);
				}
			});
		} else {
			console.warn('dropdownTournaments not found.');
		}
	}


	displayJoinModal(tournamentId, tournamentType, tournamentName, tournamentCreator) {
		document.getElementById("join-tournament-name").innerHTML = `Name: ${tournamentName}<br>Creator: ${tournamentCreator}`;

		console.log("Joining tournament", tournamentId, tournamentType);
		if (tournamentType === 'private') {
			document.querySelector('#codeInput').innerHTML = `
				<input type="text" class="form-control" id="code" name="code" placeholder="Invitation code" required>
				<label data-i18n="invitation-code" for="code"></label>`;
        	setTimeout(() => languageSelector.updateLanguage(), 0);
		}
		else
			document.querySelector('#codeInput').innerHTML = '';

		const	joinModalElement = document.getElementById('joinModal');
		const	joinModal = new bootstrap.Modal(joinModalElement, {backdrop: false, keyboard: true});
		joinModal.show();

		const joinForm = document.querySelector("#joinForm");

		this.addEventListener(joinForm, "submit", (event) => {
			event.preventDefault();

			const formData = new FormData(event.target);
			const jsonData = {};

			formData.forEach((value, key) => {
				jsonData[key] = value;
			});

			jsonData['tournament_id'] = tournamentId;
        	jsonData['tournament_type'] = tournamentType;

			const message = JSON.stringify({
				type: 'join_tournament',
				tournament_id: jsonData.tournament_id,
				tournament_type: jsonData.tournament_type,
				password: jsonData.code || null,
        	});

			try {
            	pongTournamentSocket.t_socket.send(message);
        	} catch (error) {
            	console.error('Failed to send notification:', error);
        	}
			joinModal.hide();
		});
	}

	joinTournamentRoom(allTournaments, type) {
		navigateTo("/tournament/" + tournamentData.id);
	}

}
