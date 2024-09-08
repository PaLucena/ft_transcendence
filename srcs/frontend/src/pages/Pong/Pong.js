import { Component } from "../../scripts/Component.js";
import { InputController } from "./InputController.js";

export class Pong extends Component {

	constructor() {
		console.log('Pong Constructor');
		super("/pages/Pong/pong.html");
		this.socket = null;
		this.controls_side = 0;
		this.player_1_name = 'Player 1';
		this.player_2_name = 'Player 2';
		this.inputController = null;
		this.responsiveValue = null;
		this.playing = true;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
	}

	destroy() {
		this.playing = false;
		if (this.socket) {
			this.socket.close();
		}
		this.removeAllEventListeners();
    }

	init() {
		this.initPong();
	}

	initPong() {
		this.setupElements();
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
	}

	setupWebsocket() {
		this.socket = new WebSocket('/ws/ponggame/');

		this.socket.onopen = () => {
			console.log("Connection established");
			this.reconnectAttempts = 0;
		};

		this.socket.onmessage = (event) => {
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
			}
		}

		this.socket.onclose = (event) => {
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}

			if (this.playing && this.reconnectAttempts < this.maxReconnectAttempts) {
				this.reconnectAttempts++;
				console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
				setTimeout(() => {
					this.setupWebsocket();
				}, 10);
			} else {
				console.log('Max reconnect attempts reached');
			}
		}

		this.socket.onerror = (error) => {
			console.log(`Error: ${error.message}`);
		}
	}

	setupEventListeners() {
		window.addEventListener('resize', this.updateResizePositions.bind(this));
	}

	updateResizePositions() {
		let NewResponsiveValue = this.getCSSVar('--responsive');
		if (this.responsiveValue !== NewResponsiveValue) {
			this.socket.send(JSON.stringify({ type: 'resize' }));
			this.responsiveValue = NewResponsiveValue;
		}
	}

	updateGameConfig(gameState) {
		this.controls_side = gameState.controls_side;
		console.log("--- control side: " + gameState.controls_side);
		this.inputController = new InputController(this.socket, gameState.controls_mode, gameState.controls_side);
		console.log("--- controlMode from controller: " + this.inputController.controls_mode);

		this.player_1_name = gameState["player_1_name"];
		this.p_1_name.innerHTML = `${gameState["player_1_name"]}`;
		this.p_1_avatar.src = gameState.player_1_avatar;
		this.player_2_name = gameState["player_2_name"];
		this.p_2_name.innerHTML = `${gameState["player_2_name"]}`;
		this.p_2_avatar.src = gameState.player_2_avatar;
		this.win_goals.innerHTML = gameState["goals_to_win"] + ' (dif.' + gameState["goals_diff"] + ')';

		if (gameState.controls_mode === 'remote' || gameState.controls_mode === 'AI') {
			this.setupRemoteControls(gameState);
		}
	}

	setupRemoteControls(gameState) {
		console.log("Modifying controls for remote and AI modes");
		console.log("Previous controls_1 innerHTML: " + this.controls_1.innerHTML);
		console.log("Previous controls_2 innerHTML: " + this.controls_2.innerHTML);
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
			this.message_line_sub_2.innerHTML = 'AI is ready';
		}
	}

	updatePositions(gameState) {
		this.ball.style.left = `${gameState["ball_x"] * this.responsiveValue}px`;
		this.ball.style.top = `${gameState["ball_y"] * this.responsiveValue}px`;
		this.p_1_paddle.style.top = `${gameState["pad_1_y"] * this.responsiveValue}px`;
		this.p_2_paddle.style.top = `${gameState["pad_2_y"] * this.responsiveValue}px`;
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
			this.message_line_super.innerHTML = `timeout: ${gameState["countdown"]}`;
			this.message_line_main.innerHTML = 'Press to start';
		} else if (gameState.state === 'player_ready' && this.message_line_sub_2.innerHTML === '') {
			if (gameState.player === 1) {
				this.message_line_sub_2.style.color = this.p_1_color;
				this.message_line_sub_2.innerHTML = `${this.player_1_name} is ready`;
			} else {
				this.message_line_sub_2.style.color = this.p_2_color;
				this.message_line_sub_2.innerHTML = `${this.player_2_name} is ready`;
			}
		} else if (gameState.state === 'countdown') {
			this.message_line_super.innerHTML = '';
			this.message_line_main.innerHTML = `Ready in ${gameState["countdown"]}...`;
			this.message_line_sub_2.innerHTML = '';
			this.controls_1.innerHTML = '';
			this.controls_2.innerHTML = '';
		} else if (gameState.state === 'game_over') {
			this.message_line_super.innerHTML = '';
			this.message_line_main.innerHTML = 'Game Over';
			this.controls_1.innerHTML = '';
			this.controls_2.innerHTML = '';
			this.playing = false;
		}
	}

	getCSSVar(name) {
		return getComputedStyle(document.documentElement).getPropertyValue(name);
	}

	getCSSSelector(name) {
		return document.querySelector(name);
		}
}
