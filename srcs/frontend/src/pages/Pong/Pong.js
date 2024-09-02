import { Component } from "../../scripts/Component.js";
import { InputController } from "./InputController.js";

export class Pong extends Component {
	constructor() {
		console.log('Pong Constructor');
		super("/pages/Pong/pong.html");
	}

	destroy() {
		console.log("Pong Custom destroy");
		this.removeAllEventListeners();
    }

	init() {
		this.initPong();
	}

	initPong() {
		// Variables
		let controls_side = 0;
		let player_1_name = 'Player 1';
		let player_2_name = 'Player 2';
		let inputController = null;

		// CSS capture
		const getCSSVar = (name) =>
			getComputedStyle(document.documentElement).getPropertyValue(name);
		const getCSSSelector = (name) =>
			document.querySelector(name);

		// Capture - responsive value
		let responsiveValue = getCSSVar('--responsive');
		// Capture - CSS environment
		const p_1_color = getCSSVar('--color-p1');
		const p_2_color = getCSSVar('--color-p2');
		// Capture - Score board elements
		const p_1_name = getCSSSelector('.player-1-name');
		const p_1_avatar = getCSSSelector('.player-1-avatar');
		const p_1_score = getCSSSelector('.player-1-score');
		const p_2_name = getCSSSelector('.player-2-name');
		const p_2_avatar = getCSSSelector('.player-2-avatar');
		const p_2_score = getCSSSelector('.player-2-score');
		const win_goals = getCSSSelector('.win-info');
		// Capture - Ball and paddles
		const ball = getCSSSelector('.ball');
		const p_1_paddle = getCSSSelector('.player-1-paddle');
		const p_2_paddle = getCSSSelector('.player-2-paddle');
		// Capture - Messages
		const message_line_super = getCSSSelector('.message-line-super');
		const message_line_main = getCSSSelector('.message-line-main');
		const message_line_sub_2 = getCSSSelector('.message-line-sub-2');
		const controls_1 = getCSSSelector('.controls-1');
		const controls_2 = getCSSSelector('.controls-2');

		// Websocket setup
		const socket = new WebSocket('/ws/ponggame/');

		// Apply game settings
		p_1_name.innerHTML = player_1_name;
		p_2_name.innerHTML = player_2_name;

		socket.onopen = function() {
			console.log("Connection established");
		};

		socket.onmessage = function(event) {
			const gameState = JSON.parse(event.data);

			if (gameState.type === 'config') {
				updateGameConfig(gameState);
			} else if (gameState.type === 'positions') {
				updatePositions(gameState);
			} else if (gameState.type === 'score') {
				updateScore(gameState);
			} else if (gameState.type === 'game_state') {
				updateGameState(gameState);
			}
		}

		socket.onclose = function(event) {
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
		}

		socket.onerror = function(error) {
			console.log(`Error: ${error.message}`);
		}

		function updateGameConfig(gameState) {
			controls_side = gameState.controls_side;
			console.log("--- control side: " + gameState.controls_side);
			inputController = new InputController(socket, gameState.controls_mode, gameState.controls_side);
			console.log("--- controlMode from controller: " + inputController.controls_mode);

			player_1_name = gameState["player_1_name"];
			p_1_name.innerHTML = `${gameState["player_1_name"]}`;
			p_1_avatar.src = gameState.player_1_avatar;
			player_2_name = gameState["player_2_name"];
			p_2_name.innerHTML = `${gameState["player_2_name"]}`;
			p_2_avatar.src = gameState.player_2_avatar;
			win_goals.innerHTML = gameState["goals_to_win"] + ' (dif.' + gameState["goals_diff"] + ')';

			if (gameState.controls_mode === 'remote' || gameState.controls_mode === 'AI') {
				console.log("Modifying controls for remote and AI modes");
				console.log("Previous controls_1 innerHTML: " + controls_1.innerHTML);
				console.log("Previous controls_2 innerHTML: " + controls_2.innerHTML);
				if (controls_side === 1) {
					controls_1.innerHTML = controls_2.innerHTML;
					controls_2.innerHTML = '';
				} else {
					controls_1.innerHTML = '';
				}
				if (gameState.controls_mode === 'AI') {
					if (controls_side === 1) {
						message_line_sub_2.style.color = p_2_color;
					} else {
						message_line_sub_2.style.color = p_1_color;
					}
					message_line_sub_2.innerHTML = 'AI is ready';

				}
			}
		}
		function updatePositions(gameState) {
			let responsiveValue = getCSSVar('--responsive');
			ball.style.left = `${gameState["ball_x"] * responsiveValue}px`;
			ball.style.top = `${gameState["ball_y"] * responsiveValue}px`;
			p_1_paddle.style.top = `${gameState["pad_1_y"] * responsiveValue}px`;
			p_2_paddle.style.top = `${gameState["pad_2_y"] * responsiveValue}px`;
		}

		function updateScore(gameState) {
			p_1_score.innerHTML = `${gameState["score_1"]}`;
			p_2_score.innerHTML = `${gameState["score_2"]}`;
		}

		function updateGameState(gameState) {
			if (gameState.state === 'playing') {
				message_line_main.innerHTML = '';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			} else if (gameState.state === 'waiting') {
				message_line_super.innerHTML = `timeout: ${gameState["countdown"]}`;
				message_line_main.innerHTML = 'Press to start';
			} else if (gameState.state === 'player_ready' && message_line_sub_2.innerHTML === '') {
				if (gameState.player === 1) {
					message_line_sub_2.style.color = p_1_color;
					message_line_sub_2.innerHTML = `${player_1_name} is ready`;
				} else {
					message_line_sub_2.style.color = p_2_color;
					message_line_sub_2.innerHTML = `${player_2_name} is ready`;
				}
			} else if (gameState.state === 'countdown') {
				message_line_super.innerHTML = '';
				message_line_main.innerHTML = `Ready in ${gameState["countdown"]}...`;
				message_line_sub_2.innerHTML = '';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			} else if (gameState.state === 'game_over') {
				message_line_super.innerHTML = '';
				message_line_main.innerHTML = 'Game Over';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			}
		}

		function updateResizePositions() {
			let NewResponsiveValue = getCSSVar('--responsive');
			if (responsiveValue !== NewResponsiveValue) {
				socket.send(JSON.stringify({ type: 'resize' }));
				responsiveValue = NewResponsiveValue;
			}
		}

		window.addEventListener('resize', updateResizePositions);
	}
}
