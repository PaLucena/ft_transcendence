import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/Router.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { tournamentSocket } from '../../scripts/utils/TournamentWebsocket.js';

export class Tournament extends Component {
	constructor(params = {}) {
		console.log("Tournament Constructor");
		console.log("Tournament params:", params);
		super('/pages/Tournament/tournament.html', params);
	}

	destroy() {
		console.log("Tournament Custom destroy");
		this.removeAllEventListeners();
	}

	init() {
		//this.getTournamentCode(this.params.tournamentId);
		this.checkCreator(this.params.tournamentId);
		this.displayInfo(this.params.tournamentId);
	}

	getTournamentCode(tournamentId) {
		console.log("Tournament ID: ", tournamentId);

		fetch(`/api/get_code/${tournamentId}`, {
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
			if (data.code !== null)
				document.getElementById('invitationCode').innerHTML = `Code: ${data.code}`;

			console.log("Código de acceso al torneo: ", data.code);
		})
		.catch((error) => {
			console.log(error);
		})
	}

	checkCreator(tournamentId) {
		fetch(`/api/get_tournament_creator/${tournamentId}`, {
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
			if (data === true) {
				document.getElementById('closeBtn').style.display = 'block';
				this.closeTournament(tournamentId)
			}
			else {
				document.getElementById('exitBtn').style.display = 'block';
				this.exitTournament(tournamentId);
			}
		})
		.catch((error) => {
			console.log(error);
		})
	}

	closeTournament(tournamentId) {
		const	closeBtn = document.getElementById('closeBtn');

		this.addEventListener(closeBtn, 'click', () => {
			fetch(`/api/close_tournament/${tournamentId}/`, {
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
				customAlert('success', 'Tournament closed', '3000');
			})
			.catch((error) => {
				console.log(error);
				customAlert('danger', `Error: ` + error.message, '');
			})
		});
	}

	exitTournament(tournamentId) {
		const	exitBtn = document.getElementById('exitBtn');

		this.addEventListener(exitBtn, 'click', () => {
			fetch(`/api/remove_participation/${tournamentId}/`, {
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
				tournamentSocket.closeWebSocket();
				navigateTo('/play');
			})
			.catch((error) => {
				console.log(error);
				customAlert('danger', `Error: ` + error.message, '');
			})
		});
	}

	displayInfo(tournamentId) {
		
		// cuando haya datos nuevos:

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
			let	tournamentInfo = {};

			tournamentInfo = data.public_tournaments.find(object => object.id == tournamentId);
			if (!tournamentInfo)
				tournamentInfo = data.private_tournaments.find(object => object.id == tournamentId);

			document.getElementById('tournamentName').innerHTML = `<p class="display-4">${tournamentInfo.name}</h1>`;

			const	players = document.querySelectorAll('[id^="player"]');

			let	userStatus = "";
			
			players.forEach(player => {
				userStatus = tournamentInfo.players[player.id.substring(6, 7) - 1];

				player.querySelector('[id^="nickname-"]').innerHTML =  userStatus ? tournamentInfo.players[player.id.substring(6, 7) - 1].nickname : "AI";
				player.querySelector('[id^="avatar-"]').src = userStatus ? tournamentInfo.players[player.id.substring(6, 7) - 1].avatar : '../../assets/images/default_avatar.jpg';
			});
		})
		.catch((error) => {
			console.log("Error: ", error);
		})
	}
}
