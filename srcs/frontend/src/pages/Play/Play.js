import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { pongTournamentSocket } from '../Tournament/PongTournamentSocket.js';
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';


export class Play extends Component {
	constructor() {
		super('/pages/Play/play.html');
		this.joinModalInstance = null;
	}


	async init() {
		await this.getActiveTournamentsOnPlayData();
		this.renderModalLayoutJoinTournament();
		this.setupEventListeners();
		setTimeout(() => languageSelector.updateLanguage(), 0);
	}

	destroy() {
		this.removeAllEventListeners();
		this.removeModalInstance();
	}

	async getActiveTournamentsOnPlayData() {
		const response = await fetch("/api/pongtournament/get_active_tournaments/", {
			method: 'GET',
			headers: {
				"Content-Type": "application/json",
			},
			credentials: 'include',
		});

        await handleResponse(response, (data) => {
			Play.displayTournaments(data.public_tournaments, data.private_tournaments, data.player_id);
        });
	}

	renderModalLayoutJoinTournament() {
		const modalsContainer = document.getElementById('modals_container');

		if (modalsContainer) {
			const modalHTML = `
				<div id="tournament_modal" class="modal-join modal fade" tabindex="-1" aria-hidden="true">
					<div class="modal-dialog modal-dialog-centered">
						<div class="modal-content">
							<div class="modal-header">
								<h1 class="modal-title fs-5">
									<!-- Tournament Title -->
								</h1>
								<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
							</div>
							<div class="modal-body my-3">
								<!-- on-create/join-with-password Tournament form -->
							</div>
							<div class="modal-footer d-flex justify-content-center">
								<!-- submit/join btn -->
							</div>
						</div>
					</div>
				</div>`;

			modalsContainer.insertAdjacentHTML('beforeend', modalHTML);

			const jointTournamentModal = document.getElementById('tournament_modal');
			if (!this.joinModalInstance) {
				this.joinModalInstance = new bootstrap.Modal(jointTournamentModal);
			}
		} else {
			console.warn('modals_container is not found.');
		}
	}


	setupEventListeners() {
		const container = document.getElementById('play_container');

		if (container) {

			const modal = document.getElementById('tournament_modal');
			if (modal) {
				this.addEventListener(modal, 'shown.bs.modal', () => {
					const tournamentForm = document.getElementById('tournament_modal_form');

					if (tournamentForm) {
						const firstInput = tournamentForm.querySelector('input');
						if (firstInput) {
							firstInput.focus();
						}
					}
				});

				this.addEventListener(modal, 'hidden.bs.modal', () => {
					const modalTitle = modal.querySelector('.modal-title');
					const modalBody = modal.querySelector('.modal-body');
					const modalFooter = modal.querySelector('.modal-footer');

					if (modalTitle) {
						modalTitle.innerHTML = '';
					}
					if (modalBody) {
						modalBody.innerHTML = '';
					}
					if (modalFooter) {
						modalFooter.innerHTML = '';
					}
				});
			}


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
			testBtn.innerHTML = "Clean Tournaments";
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

			const tournamentsContainer = document.getElementById("dropdownTournaments");
			if (tournamentsContainer) {
				this.addEventListener(tournamentsContainer, "click", (event) => {
					let closestElement = event.target.closest(".tournament-item-btn");

					if (closestElement) {
						let tournamentId = closestElement.getAttribute("data-tournament-id");
						let tournamentName = closestElement.getAttribute("data-tournament-name");
						let tournamentType = closestElement.getAttribute("data-tournament-type");
						let tournamentCreator = closestElement.getAttribute("data-tournament-creator");
						let tournamentMember = closestElement.getAttribute("data-tournament-is-member");

						if (tournamentMember === 'false') {
							if (tournamentType === 'public') {
								this.setTournamentModalTitle(`Join ${tournamentName} tournament`);
								this.setTournamentModalContent('join_public', tournamentName, tournamentCreator);
							} else if (tournamentType === 'private') {
								this.setTournamentModalTitle(`Join ${tournamentName} tournament`);
								this.setTournamentModalContent('join_private', tournamentName, tournamentCreator);
							} else {
								console.error('Invalid type passed on Join tournament');
							}
							this.showTournamentModal();
							this.joinTournament(tournamentId, tournamentType);
						} else {
							this.joinTournamentRoom(tournamentId);
						}
					}
				});
			}

			const createTournamentButtons = container.querySelectorAll('.create-tournament-btn');
			createTournamentButtons.forEach(button => {
				this.addEventListener(button, 'click', () => {
					const creationType = button.getAttribute('data-tournament-creation-type');

					if (creationType) {
						if (creationType === 'public') {
							this.setTournamentModalTitle(`Create ${creationType} tournament`);
							this.setTournamentModalContent('create_public');
						} else if (creationType === 'private') {
							this.setTournamentModalTitle(`Create ${creationType} tournament`);
							this.setTournamentModalContent('create_private');
						} else {
							console.error('Invalid argument type passed on Create Tournament.');
						}
						this.showTournamentModal();
						this.createTournament(creationType);
					}
				});
			});

			// local
			const	localBtn = document.getElementById("localBtn");
			this.addEventListener(localBtn, "click", () => {
				this.playLocal();
				navigateTo("/pong");
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
		} else {
			console.warn('play_container is not found.');
		}
	}

	setTournamentModalTitle(text) {
		if (text) {
			const modal = document.getElementById('tournament_modal');

			if  (modal) {
				const titleContainer = modal.querySelector('.modal-title');

				if (titleContainer) {
					titleContainer.innerHTML = text;
				}
			} else {
				console.warn('tournament_modal is not found.');
			}
		}
	}

	setTournamentModalContent(type, name=null, creator=null) {
		if (type) {
			const modal = document.getElementById('tournament_modal');

			if  (modal) {
				const bodyContainer = modal.querySelector('.modal-body');
				const footerContainer = modal.querySelector('.modal-footer');

				if (bodyContainer || footerContainer) {
					switch (type) {
						case 'create_public':
							bodyContainer.innerHTML = `
								<form id="tournament_modal_form">
									<div class="form-floating">
										<input type="text" class="form-control" id="tournament_name" name="name" placeholder="Tournament name" required>
										<label for="name">Tournament name</label>
									</div>
								</form>`;

							footerContainer.innerHTML = `
								<button type="submit" form="tournament_modal_form" class="btn btn-primary">Create</button>
							`;
							break;
						case 'create_private':
							bodyContainer.innerHTML = `
								<form id="tournament_modal_form">
									<div class="form-floating mb-1">
										<input type="text" class="form-control" id="tournament_name" name="name" placeholder="Tournament name" required>
										<label for="name">Tournament name</label>
									</div>
									<div class="form-floating">
										<input type="text" class="form-control" id="tournament_password" name="code" placeholder="Tournament password" required>
										<label for="code">Tournament password</label>
									</div>
								</form>`;
							footerContainer.innerHTML = `
								<button type="submit" form="tournament_modal_form" class="btn btn-primary">Create</button>
							`;
							break;
						case 'join_public':
							bodyContainer.innerHTML = `
								<div>
									<p>Name: ${name || 'Anonymous Tournament'}</p>
									<p>Creator: ${creator || 'Anonymous Player'}</p>
								</div>
								<form id="tournament_modal_form"></form>
							`;
							footerContainer.innerHTML = `
								<button type="submit" form="tournament_modal_form" class="btn btn-primary">Join</button>
							`;
							break;
						case 'join_private':
							bodyContainer.innerHTML = `
								<div>
									<p>Name: ${name || 'Anonymous Tournament'}</p>
									<p>Creator: ${creator || 'Anonymous Player'}</p>
								</div>
								<form id="tournament_modal_form">
									<div class="form-floating">
										<input type="text" class="form-control" id="tournament_password" name="code" placeholder="Tournament password" required>
										<label for="code">Tournament password</label>
									</div>
								</form>
							`;
							footerContainer.innerHTML = `
								<button type="submit" form="tournament_modal_form" class="btn btn-primary">Join</button>
							`;
							break;
						default:
						 console.error('Play.js setTournamentModalBody invalid argument type passed.');
					}
				}
			} else {
				console.warn('tournament_modal is not found.');
			}
		}
	}

	// local match
	playLocal() {
		fetch("/api/new_single_match/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				"player_2_id": 0,
				"controls_mode": "local"
			})
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
		fetch("/api/new_single_match/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				"player_2_id": 0,
				"controls_mode": "AI"
			})
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

	createTournament(type) {
		const tournamentForm = document.getElementById("tournament_modal_form");

		this.handleTournamentSubmit = async (event) => {
			event.preventDefault();

			const formData = new FormData(event.target);

			try {
				let is_private = type === 'private';

				pongTournamentSocket.t_socket.send(JSON.stringify({
					type: 'create_tournament',
					name: formData.get("name"),
					is_private,
					password: is_private ? formData.get('code') : null,
				}));

				this.hideTournamentModal();
			} catch (error) {
				console.error('Failed on create tournament:', error);
			}
		};

		tournamentForm.onsubmit = this.handleTournamentSubmit;
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
					? `⭐ ${public_tournaments[i].name}`
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
						data-tournament-is-member = "${isPlayer}"
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
					? `⭐ ${private_tournaments[i].name}`
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
						data-tournament-is-member = "${isPlayer}"
					>
						<span class="tName">
							${tournamentName}
						</span>
						[${private_tournaments[i].participants.length}]
					</button>`;
			}
		}
	}

	joinTournament(id, type) {
		const tournamentForm = document.getElementById("tournament_modal_form");

		this.handleTournamentSubmit = async (event) => {
			event.preventDefault();

			const formData = new FormData(event.target);

			try {
				pongTournamentSocket.t_socket.send(JSON.stringify({
					type: 'join_tournament',
					tournament_id: id,
					tournament_type: type,
					password: formData.get('code') || null,
				}));

				this.hideTournamentModal();
			} catch (error) {
				console.error('Failed on join tournament:', error);
			}
		};

		tournamentForm.onsubmit = this.handleTournamentSubmit;
	}

	joinTournamentRoom(tournamentId) {
		try {
			pongTournamentSocket.t_socket.send(JSON.stringify({
				type: 'join_tournament_room',
				tournament_id: tournamentId,
			}));
		} catch (error) {
			console.error('Failed on send join tournament room:', error);
		}
	}

	showTournamentModal() {
		const container = document.getElementById('tournament_modal');

		if (container) {
			const instance = bootstrap.Modal.getInstance(container);
			if (instance) {
				instance.show();
			}
		}
	}

	hideTournamentModal() {
		const container = document.getElementById('tournament_modal');

		if (container) {
			const instance = bootstrap.Modal.getInstance(container);
			if (instance) {
				instance.hide();
			}
		}
	}

	removeModalInstance() {
		const modalsContainer = document.getElementById('modals_container');
		const jointTournamentModal = document.getElementById('tournament_modal');

		if (modalsContainer && jointTournamentModal) {
			modalsContainer.removeChild(jointTournamentModal);
			this.joinModalInstance = null;
		}
	}
}
