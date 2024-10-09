import { Component } from "../../scripts/Component.js";
import customAlert from "../../scripts/utils/customAlert.js";
import { handleResponse } from "../../scripts/utils/rtchatUtils.js";
import { pongTournamentSocket } from './PongTournamentSocket.js';
import {navigateTo} from "../../scripts/Router.js";

export class Tournament extends Component {
	constructor(params = {}) {
		super('/pages/Tournament/tournament.html', params);
	}

	destroy() {
		console.log('Tournament custom destroy');

		this.removeAllEventListeners();
	}

	async init() {
		if (this.params.tournamentId) {
			await this.getTournamentRoomData(this.params.tournamentId);
		}
	}

	async getTournamentRoomData(tournamentId) {
		try {
			const response = await fetch(`/api/pongtournament/get_tournament_room_data/${tournamentId}`, {
				method: 'GET',
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
			});

			await handleResponse(response, (data) => {
				console.log('Tournament room data:', data);
				this.renderButtons(data.creator_id, data.current_id)
				Tournament.renderPlayers(data.participants_data, data.players, data.tournament_name, data.current_phase);
			});
		} catch(error) {
            this.handleError(error.errorCode, error.errorMessage);
			navigateTo('/play');
        }
	}

	handleError(errorCode, errorMessage) {
		switch (errorCode) {
			case 403:
				customAlert('danger', errorMessage, 5000);
				break ;
			case 500:
				customAlert('danger', 'An internal server error occurred.', 5000);
				break;
			default:
				console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
		}
	}


	renderButtons(creatorId, currentId) {
		const container = document.getElementById('root_tournament_container');

		if (container) {
			console.log("PARAMS:", this.params);
			const btnContainer = container.querySelector('#root_tournament_btn_container');

			if (btnContainer) {
				if (creatorId === currentId) {
					btnContainer.innerHTML = `
						<button data-tournament-action="start" class="btn btn-primary">Start Tournament</button>
						<button data-tournament-action="leave" class="btn btn-danger">Delete Tournament</button>
					`;
				} else {
					btnContainer.innerHTML = `
						<button data-tournament-action="leave" class="btn btn-danger">Leave</button>
					`;
				}

				this.addEventListener(btnContainer, 'click', (event) => {
					const btn = event.target.closest('.btn');
					if (btn) {
						const action = btn.getAttribute('data-tournament-action');
						if (action === 'start') {
							pongTournamentSocket.t_socket.send(JSON.stringify({
								type: 'start_tournament',
								tournament_id: this.params.tournamentId
							}));
						} else if (action === 'leave') {
							pongTournamentSocket.t_socket.send(JSON.stringify({
								type: 'leave_tournament',
								tournament_id: this.params.tournamentId
							}));
						}
					}
				});
			} else {
				console.warn('root_tournament_btn_container is not found.');
			}
		} else {
			console.warn('root_tournament_container is not found.');
		}
	}

	static renderPlayers(participants, players, name, phase) {
		const topHalf = document.querySelector('.top-half');
		const bottomHalf = document.querySelector('.bottom-half');

		const totalPlayers = 8;

		const defaultAvatar = '/assets/images/default_avatar.jpg';
		const defaultNickname = 'IA';

		const fullPlayerList = [...participants];

		while (fullPlayerList.length < totalPlayers) {
			fullPlayerList.push({
				nickname: defaultNickname,
				avatar: defaultAvatar
			});
		}

		if (topHalf && bottomHalf) {
			topHalf.innerHTML = '';
			bottomHalf.innerHTML = '';

			const room_header = document.getElementById('tournamentName');
			room_header.innerHTML = name + "<br>" + phase;

			for (let i = 0; i < 4; i += 2) {
				const matchContainerHtml = `
					<div class="match-container col d-flex justify-content-center align-items-end ml-0">
						${createPlayerHtml(fullPlayerList[i], i + 1, players)}
						${createPlayerHtml(fullPlayerList[i + 1], i + 2, players)}
					</div>
				`;
				topHalf.insertAdjacentHTML('beforeend', matchContainerHtml);
			}

			for (let i = 4; i < 8; i += 2) {
				const matchContainerHtml = `
					<div class="match-container col d-flex justify-content-center align-items-end ml-0">
						${createPlayerHtml(fullPlayerList[i], i + 1, players)}
						${createPlayerHtml(fullPlayerList[i + 1], i + 2, players)}
					</div>
				`;
				bottomHalf.insertAdjacentHTML('beforeend', matchContainerHtml);
			}
		}

		function createPlayerHtml(player, index, players) {
			let avatarColor = 'black';

			if (player.user_id) {
				avatarColor = players.includes(player.user_id) ? 'green' : 'red';
			}
			return `
				<div id="player${index}" class="player-container row d-flex col-6 h-60 justify-content-center">
					<div class="col-10 col-sm-6">
						<div class="d-flex justify-content-center">
							<div class="avatar rounded-circle" style="border: 5px solid ${avatarColor};">
								<img id="avatar-${index}" class="rounded-circle h-100 square" src="${player.avatar}" alt="">
							</div>
						</div>
						<div class="nickname-placeholder col-12 m-0 d-flex justify-content-center row mt-1">
							<span id="nickname-${index}" class="nickname bg-light rounded-2 text-center py-1">${player.user_name || 'AI'}</span>
						</div>
					</div>
				</div>
			`;
		}
	}

}
