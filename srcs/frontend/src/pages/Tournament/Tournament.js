import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/Router.js';
import customAlert from '../../scripts/utils/customAlert.js';

export class Tournament extends Component {
	constructor(params = {}) {
		console.log("Tournament Constructor");
		super('/pages/Tournament/tournament.html', params);
	}

	destroy() {
		console.log("Tournament Custom destroy");
		this.removeAllEventListeners();
	}

	init() {
		//this.joinTournament();
		this.getTournamentCode(this.params.tournamentId);
		this.checkCreator(this.params.tournamentId);
		this.displayInfo(this.params.tournamentId);
	}

	/* joinTournament(id) {
		$('#join_tournament_form').on('submit', function (event) {
			event.preventDefault();
			const formData = new FormData(event.target);
			const jsonData = {};

			formData.forEach((value, key) => {
				jsonData[key] = value;
			});

			const tournamentId = jsonData['tournament_id']; // Assuming this is in the form
			//const csrftoken = getCSRFToken('csrftoken');

			fetch(`/api/join_tournament/${id}/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include'
			})
			.then(response => {
				if (!response.ok) {
					return response.json().then(errorData => {
						throw new Error(errorData.detail || `Response status: ${response.status}`);
					});
				}
				return response.json();
			})
			.then(data => {
				console.log(data);

				if (data.chatroom_name) {
					alert(`Joining tournament ${id}.`);
					window.location.href = `/chat/${data.chatroom_name}`;
				} else {
					alert(`Error joining tournament. ${data.detail ? data.detail : ''}`);
				}
			})
			.catch(error => {
				console.error("Error joining tournament: ", error);
				alert(`Error joining tournament: ${error.message}`);
			});
		});
	} */

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
			document.getElementById('invitationCode').innerHTML = data.code;

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
				navigateTo('/play');
			})
			.catch((error) => {
				console.log(error);
				customAlert('danger', `Error: ` + error.message, '');
			})
		});
	}

	displayInfo(tournamentId) {
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
				player.querySelector('[id^="avatar-"]').src = userStatus ? tournamentInfo.players[player.id.substring(6, 7) - 1].avatar : 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';
			});
		})
		.catch((error) => {
			console.log("Error: ", error);
		})
	}
}
