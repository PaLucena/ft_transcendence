import { Component } from "../../scripts/Component.js";

export class Tournament extends Component {
	constructor(params = {}) {
		super('/pages/Tournament/tournament.html', params);
	}

	async init() {
		this.joinTournament();
		this.cosasDeTorneo(this.params);
	}

	joinTournament(id) {
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
	}

	cosasDeTorneo(tournamentId) {
		console.log("Id del torneo: ", tournamentId);
	}
}
