import { Component } from "../../scripts/Component.js";
import { InputController } from "./InputController.js";
import { navigateTo } from "../../scripts/Router.js";
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';

export class Pong extends Component {

	constructor() {
		super("/pages/Pong/pong.html");
		this.gameSocket = null;
		this.controls_side = 0;
		this.game_environment = null;
		this.tournament_id = null;
		this.user_id = null;
		this.player_1_name = 'Player 1';
		this.player_2_name = 'Player 2';
		this.inputController = null;
		this.responsiveValue = null;
		this.playing = false;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;

		this.frameCounter = 0;
		this.init_time = Date.now();
	}

	destroy() {
		this.playing = false;
		this.removeAllEventListeners();
    }

	init() {
		this.initPong();
		setTimeout(() => languageSelector.updateLanguage(), 0);
	}

	initPong() {
		this.setupElements();
		this.safeDefaultValues();
		this.setupWebsocket();
		this.setupEventListeners();
	}

	setupElements() {
		// Capture - responsive value
		this.responsiveValue = this.getCSSVar('--responsive');
		// Capture - CSS environment
		this.p_1_color = this.getCSSVar('--color-p1');
		this.p_2_color = this.getCSSVar('--color-p2');
		// Capture - Score board elements
		this.p_1_name = this.getCSSSelector('.player-1-name');
		this.p_1_avatar = this.getCSSSelector('.player-1-avatar');
		this.p_1_score = this.getCSSSelector('.player-1-score');
		this.p_2_name = this.getCSSSelector('.player-2-name');
		this.p_2_avatar = this.getCSSSelector('.player-2-avatar');
		this.p_2_score = this.getCSSSelector('.player-2-score');
		this.win_goals = this.getCSSSelector('.win-info');
		// Capture - Ball and paddles
		this.ball = this.getCSSSelector('.ball');
		this.p_1_paddle = this.getCSSSelector('.player-1-paddle');
		this.p_2_paddle = this.getCSSSelector('.player-2-paddle');
		// Capture - Messages
		this.message_line_super = this.getCSSSelector('.message-line-super');
		this.message_line_main = this.getCSSSelector('.message-line-main');
		this.message_line_sub_2 = this.getCSSSelector('.message-line-sub-2');
		this.controls_1 = this.getCSSSelector('.controls-1');
		this.controls_2 = this.getCSSSelector('.controls-2');
		// Capture - Buttons
		this.button_return = document.getElementById('button-return');
		this.button_quit = document.getElementById('button-quit');

		this.p1_button_up = document.getElementById('p1-up');
		this.p1_button_down = document.getElementById('p1-down');
		this.p1_button_ready = document.getElementById('p1-ready');
		this.p2_button_up = document.getElementById('p2-up');
		this.p2_button_down = document.getElementById('p2-down');
		this.p2_button_ready = document.getElementById('p2-ready');
		this.button_confirm_quit = document.getElementById('button-confirm-quit');
	}

	safeDefaultValues() {
		this.message_line_super.innerHTML = '';
		this.message_line_main.innerHTML = '';
		this.message_line_main.innerHTML = '<span data-i18n="press-to-start"></span>'
		this.message_line_sub_2.innerHTML = '';
		this.button_return.style.display = 'none';
	}

	setupWebsocket() {
		this.gameSocket = new WebSocket('/ws/ponggame/');

		this.gameSocket.onopen = () => {
			this.playing = true;
			console.log("Connection established");
			this.reconnectAttempts = 0;
		};

		this.gameSocket.onmessage = (event) => {
			const gameState = JSON.parse(event.data);

			switch (gameState.type) {
				case 'config':
					this.updateGameConfig(gameState);
					break;
				case 'positions':
					this.updatePositions(gameState);
					break;
				case 'score':
					this.updateScore(gameState);
					break;
				case 'game_state':
					this.updateGameState(gameState);
					break;
				case 'game_over':
					this.handle_return();
					break;
			}
		}

		this.gameSocket.onclose = (event) => {
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
		}

		this.gameSocket.onerror = (error) => {
			console.log(`Error: ${error.message}`);
		}
	}

	setupEventListeners() {
		const	quitModalElement = document.getElementById("quitModal");
		const quitModal = new bootstrap.Modal(quitModalElement, {backdrop: false, keyboard: true});

		window.addEventListener('resize', this.updateResizePositions.bind(this));
		this.button_return.addEventListener('click', () => {
			navigateTo('/play');
		});
		this.button_quit.addEventListener('click', () => {
			quitModal.show();
		});
		this.button_confirm_quit.addEventListener('click', () => {
			quitModal.hide();
			this.inputController.execCommands(`quit_p${this.controls_side}`);
		});
		this.p1_button_ready.addEventListener('contextmenu', event => event.preventDefault());
		this.p1_button_down.addEventListener('contextmenu', event => event.preventDefault());
		this.p1_button_up.addEventListener('contextmenu', event => event.preventDefault());
		this.p2_button_ready.addEventListener('contextmenu', event => event.preventDefault());
		this.p2_button_down.addEventListener('contextmenu', event => event.preventDefault());
		this.p2_button_up.addEventListener('contextmenu', event => event.preventDefault());
	}

	updateResizePositions() {
		let NewResponsiveValue = this.getCSSVar('--responsive');
		if (this.responsiveValue !== NewResponsiveValue) {
			this.gameSocket.send(JSON.stringify({ type: 'resize' }));
			this.responsiveValue = NewResponsiveValue;
		}
	}

	updateGameConfig(gameState) {
		console.log('Game Config:', gameState);
		this.controls_side = gameState.controls_side;
		this.inputController = new InputController(this.gameSocket, gameState.controls_mode, gameState.controls_side);
		this.game_environment = gameState.game_environment;
		this.tournament_id = gameState.tournament_id;
		this.player_1_name = gameState.player_1_name;
		this.p_1_name.innerHTML = `${gameState.player_1_name}`;
		this.p_1_avatar.src = gameState.player_1_avatar;
		this.player_2_name = gameState.player_2_name;
		this.p_2_name.innerHTML = `${gameState.player_2_name}`;
		this.p_2_avatar.src = gameState.player_2_avatar;
		this.win_goals.innerHTML = gameState["goals_to_win"] + ' (dif.' + gameState["goals_diff"] + ')';
		this.user_id = gameState.user_id;

		if (gameState.controls_mode === 'remote' || gameState.controls_mode === 'AI') {
			this.setupRemoteControls(gameState);
		}
	}

	setupRemoteControls(gameState) {
		if (this.controls_side === 1) {
			this.controls_1.innerHTML = this.controls_2.innerHTML;
			this.controls_2.innerHTML = '';
		} else {
			this.controls_1.innerHTML = '';
		}
		if (gameState.controls_mode === 'AI') {
			if (this.controls_side === 1) {
				this.message_line_sub_2.style.color = this.p_2_color;
			} else {
				this.message_line_sub_2.style.color = this.p_1_color;
			}
			this.message_line_sub_2.innerHTML = '<span data-i18n="ai-is-ready"></span>';
		}
	}

	updatePositions(gameState) {
		this.ball.style.left = `${gameState["ball_x"] * this.responsiveValue}px`;
		this.ball.style.top = `${gameState["ball_y"] * this.responsiveValue}px`;
		this.p_1_paddle.style.top = `${gameState["pad_1_y"] * this.responsiveValue}px`;
		this.p_2_paddle.style.top = `${gameState["pad_2_y"] * this.responsiveValue}px`;
		this.frameCounter++;
		if (Date.now() - this.init_time > 1000) {
			this.init_time = Date.now();
			this.frameCounter = 0;
		}
	}

	updateScore(gameState) {
		this.p_1_score.innerHTML = `${gameState["score_1"]}`;
		this.p_2_score.innerHTML = `${gameState["score_2"]}`;
	}

	updateGameState(gameState) {
		if (gameState.state === 'playing') {
			this.message_line_main.innerHTML = '';
			this.controls_1.innerHTML = '';
			this.controls_2.innerHTML = '';
		} else if (gameState.state === 'waiting') {
			this.message_line_super.innerHTML = `${gameState["countdown"]}`;
		//	this.message_line_main.innerHTML = '<span data-i18n="press-to-start"></span>';
		} else if (gameState.state === 'player_ready' && this.message_line_sub_2.innerHTML === '') {
			if (gameState.player === 1) {
				this.message_line_sub_2.style.color = this.p_1_color;
				this.message_line_sub_2.innerHTML = `${this.player_1_name} <span data-i18n="is-ready"></span>`;
			} else {
				this.message_line_sub_2.style.color = this.p_2_color;
				this.message_line_sub_2.innerHTML = `${this.player_2_name} <span data-i18n="is-ready"></span>`;
			}
		} else if (gameState.state === 'countdown') {
			this.message_line_super.innerHTML = '';
			this.message_line_main.innerHTML = `${gameState["countdown"]}...`;
			this.message_line_sub_2.innerHTML = '';
			this.controls_1.innerHTML = '';
			this.controls_2.innerHTML = '';
		} else if (gameState.state === 'game_over') {
			this.message_line_super.innerHTML = '';
			this.message_line_main.innerHTML = '<span data-i18n="game-over"></span>';
			this.message_line_sub_2.innerHTML = "";
			if (gameState.forfeit) {
				if (gameState.forfeit === this.controls_side) {
					this.message_line_sub_2.innerHTML = '<span data-i18n="">Defeat!<br>You have given up.</span>';
				} else {
					this.message_line_sub_2.innerHTML = '<span data-i18n="">Victory!<br>Your opponent has given up.</span>';
				}
			} else {
				if (gameState.winner === this.controls_side) {
					this.message_line_sub_2.innerHTML = '<span data-i18n="">Victory!</span>';
				} else {
					this.message_line_sub_2.innerHTML = '<span data-i18n="">Defeat!</span>';
				}
			}
			this.controls_1.innerHTML = '';
			this.controls_2.innerHTML = '';
			this.playing = false;
			this.button_quit.style.display = 'none';
		}
	}

	handle_return() {
		setTimeout(() => {
				if (this.game_environment === 'tournament') {
					this.game_environment = null;
					navigateTo(`/tournament/${this.tournament_id}`);
				} else if (this.game_environment === 'single') {
					this.game_environment = null;
					navigateTo('/play');
				}
			}, 2000);
	}


	getCSSVar(name) {
		return getComputedStyle(document.documentElement).getPropertyValue(name);
	}

	getCSSSelector(name) {
		return document.querySelector(name);
		}
}
