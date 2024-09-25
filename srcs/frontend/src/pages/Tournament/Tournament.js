import { Component } from "../../scripts/Component.js";
import { navigateTo } from '../../scripts/Router.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { tournamentSocket } from '../../scripts/utils/TournamentWebsocket.js';

export class Tournament extends Component {
	constructor(params = {}) {
		super('/pages/Tournament/tournament.html', params);
	}

	destroy() {
		this.removeAllEventListeners();
	}

	init() {
		this.getTournamentCode(this.params.tournamentId);
		this.checkCreator(this.params.tournamentId);
		this.displayInfo(this.params.tournamentId);
	}

	getTournamentCode(tournamentId) {
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
			if (data.code !== null) {
				document.getElementById('invitationCode').innerHTML = `<span data-i18n='code'></span>: ${data.code}`;
				languageSelector.updateLanguage();
			}
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
			document.getElementById('exitBtn').style.display = 'block';
			this.exitTournament(tournamentId);
		})
		.catch((error) => {
			console.log("Error(checkCreator):", error.message);
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
				console.log("Error(closeTournament):", error.message);
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
				console.log("Error(exitTournament):", error.message);
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
            console.log("Error(displayInfo):", error.message);
        });
    }

	static renderPlayers(players) {

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
			console.warn('topHalf or bottomHalf not found.');
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
					<p id="tournamentName" class="d-flex justify-content-center display-6">${tournament_name}</p>
					<div class="d-flex justify-content-center">
						<p id="invitationCode"></p>
					</div>
				</div>
			</div>

			<div class="top-half d-flex h-40 w-100 m-0"></div>
			<div class="bottom-half d-flex h-60 w-100 m-0 mt-2"></div>

            <div class="close-exit-btn-container col-12 d-flex justify-content-center">
				<div class="close-exit-btn col-3 col-sm-2 col-lg-1 gap-2 d-flex justify-content-center">
                	<button id="closeBtn" data-i18n='close-tournament-button' class="btn btn-primary hide"></button>
                	<button id="exitBtn" data-i18n='exit-tournament-button' class="btn btn-danger hide"></button>
				</div>
            </div>
        `;
		setTimeout(() => languageSelector.updateLanguage(), 0);
        return html;
    }
}
