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
		this.getTournamentCode(this.params);
		this.checkCreator(this.params);
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
		console.log("Tournament ID: ", tournamentId.tournamentId);

		fetch(`/api/get_code/${tournamentId.tournamentId}`, {
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

			console.log("Código de acceso al torneo: ", data);
		})
		.catch((error) => {
			console.log(error);
		})
	}

	checkCreator(tournamentId) {
		fetch(`/api/get_tournament_creator/${tournamentId.tournamentId}`, {
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
			console.log("Respuesta de get_tournament_creator: ", data);
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
			fetch(`/api/close_tournament/${tournamentId.tournamentId}/`, {
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
			fetch(`/api/remove_participation/${tournamentId.tournamentId}/`, {
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
				console.log("AAAA:", data);
				customAlert('success', data.success, '3000');
				navigateTo('/play');
			})
			.catch((error) => {
				console.log(error);
				customAlert('danger', `Error: ` + error.message, '');
			})
		});
	}
}
