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
            let tournament = data.public_tournaments.find(t => t.id == tournamentId);
            if (!tournament) {
                tournament = data.private_tournaments.find(t => t.id == tournamentId);
            }

            if (tournament) {
				const container = document.getElementById('rootTournament');

				if (container) {
					container.innerHTML = this.createHtml(tournament.name);
					tournamentSocket.initWebSocket(tournament.name);
				} else {
					console.warn('rootTournament not found.');
				}
            } else {
                console.warn(`Tournament with ID ${tournamentId} not found.`);
            }
        })
        .catch((error) => {
            console.log("Error: ", error);
        });
    }

	static renderPlayers(players) {

		console.log("PLayers: ", players);

		const topHalf = document.querySelector('.top-half');
		const bottomHalf = document.querySelector('.bottom-half');

		const totalPlayers = 8;

		const defaultAvatar = '/assets/images/default_avatar.jpg';
		const defaultNickname = 'IA';

		const fullPlayerList = [...players];

		while (fullPlayerList.length < totalPlayers) {
			fullPlayerList.push({
				nickname: defaultNickname,
				avatar: defaultAvatar
			});
		}

		if (topHalf && bottomHalf) {
			topHalf.innerHTML = '';
			bottomHalf.innerHTML = '';

			for (let i = 0; i < 4; i += 2) {
				const matchContainerHtml = `
					<div class="match-container col d-flex justify-content-center align-items-end ml-0">
						${createPlayerHtml(fullPlayerList[i], i + 1)}
						${createPlayerHtml(fullPlayerList[i + 1], i + 2)}
					</div>
				`;
				topHalf.insertAdjacentHTML('beforeend', matchContainerHtml);
			}

			for (let i = 4; i < 8; i += 2) {
				const matchContainerHtml = `
					<div class="match-container col d-flex justify-content-center align-items-end ml-0">
						${createPlayerHtml(fullPlayerList[i], i + 1)}
						${createPlayerHtml(fullPlayerList[i + 1], i + 2)}
					</div>
				`;
				bottomHalf.insertAdjacentHTML('beforeend', matchContainerHtml);
			}
		} else {
			console.warn('topHalf или bottomHalf не найдены.');
		}

		function createPlayerHtml(player, index) {
			return `
				<div id="player${index}" class="player-container row d-flex col-6 h-60 justify-content-center">
					<div class="col-10 col-sm-6">
						<div class="d-flex justify-content-center">
							<div class="avatar rounded-circle">
								<img id="avatar-${index}" class="rounded-circle h-100 square" src="${player.avatar}" alt="">
							</div>
						</div>
						<div class="nickname-placeholder col-12 m-0 d-flex justify-content-center row mt-1">
							<span id="nickname-${index}" class="nickname bg-light rounded-2 text-center py-1">${player.nickname}</span>
						</div>
					</div>
				</div>
			`;
		}
	}


	createHtml(tournament_name) {
        const html = `
            <div class="tournament-name col-12 d-flex justify-content-center">
				<div>
					<p id="tournamentName">${tournament_name}</p>
					<div class="d-flex justify-content-center">
						<p id="invitationCode"></p>
					</div>
				</div>
			</div>

            <div class="top-half d-flex h-40 w-100 m-0"></div>
            <div class="bottom-half d-flex h-60 w-100 m-0 mt-2"></div>

            <div class="close-exit-btn col-12 d-flex justify-content-center">
                <button id="closeBtn" class="btn btn-primary hide">CLOSE TOURNAMENT</button>
                <button id="exitBtn" class="btn btn-danger hide">EXIT TOURNAMENT</button>
            </div>
        `;
        return html;
    }
}
