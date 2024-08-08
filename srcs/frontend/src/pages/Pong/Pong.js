import { Component} from "../../scripts/Component.js";

export class Pong extends Component {
	constructor() {
		super("/pages/Pong/pong.html");
	}

	init() {
		this.initPong();
	}


	initPong() {
		// Variables
		let name_1 = 'Player 1';
		let name_2 = 'Player 2';
		const pad_width = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-pad-width'));
		const pad_height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-pad-height'));
		const pad_margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-pad-margin'));
		const ball_size = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-ball'));

		let keysPressed = {};
		let paddle1Interval;
		let paddle2Interval;

		let factor = 1;

		// Capture - responsive value
		let responsiveValue = getComputedStyle(document.documentElement).getPropertyValue('--responsive');
		// Capture - CSS environment
		const p_1_color = getComputedStyle(document.documentElement).getPropertyValue('--color-p1');
		const p_2_color = getComputedStyle(document.documentElement).getPropertyValue('--p2-color');
		const ball_color = getComputedStyle(document.documentElement).getPropertyValue('--ball-color');
		// Capture - Containers
		const container = document.querySelector('.containerPong');
		const board = document.querySelector('.board');
		// Capture - Score board elements
		const p_1_name = document.querySelector('.player_1_name');
		const p_1_avatar = document.querySelector('.player_1_avatar');
		const p_1_score = document.querySelector('.player_1_score');
		const p_2_name = document.querySelector('.player_2_name');
		const p_2_avatar = document.querySelector('.player_2_avatar');
		const p_2_score = document.querySelector('.player_2_score');
		const win_goals = document.querySelector('.win_goals');
		// Capture - Ball and paddles
		const ball = document.querySelector('.ball');
		const ball_effect = document.querySelector('.ball_effect');
		const p_1_paddle = document.querySelector('.player_1_paddle');
		const p_2_paddle = document.querySelector('.player_2_paddle');
		// Capture - Messages
		const message = document.querySelector('.main-message');
		const controls_1 = document.querySelector('.controls_1');
		const controls_2 = document.querySelector('.controls_2');

		// Apply game settings
		p_1_name.innerHTML = name_1;
		p_2_name.innerHTML = name_2;

		// Websocket setup
		const socket = new WebSocket('ws/ponggame/');

		socket.onopen = function(event) {
			console.log("Connection established");
		};

		socket.onmessage = function(event) {
			const gameState = JSON.parse(event.data);
			if (gameState.type === 'positions') {
				updatePositions(gameState);
			} else if (gameState.type === 'score') {
				updateScore(gameState);
			} else if (gameState.type === 'game_state') {
				updateGameState(gameState);
			} else if (gameState.type === 'config') {
				updateGameConfig(gameState);
			} else if (gameState.type === 'theme') {
				document.documentElement.style.setProperty('--color-board-gradient-start', gameState.gradient_start);
				document.documentElement.style.setProperty('--color-board-gradient-end', gameState.gradient_end);
				document.documentElement.style.setProperty('--ball-border-radius', gameState.ball_border_radius);
				document.documentElement.style.setProperty('--color-p1', gameState.color_p1);
				document.documentElement.style.setProperty('--color-p2', gameState.color_p2);
				document.documentElement.style.setProperty('--paddle-border-radius', gameState.paddle_border_radius);
				document.documentElement.style.setProperty('--paddle-color', gameState.paddle_color);
				document.documentElement.style.setProperty('--color-background', gameState.color_background);
				document.documentElement.style.setProperty('--container-border-radius', gameState.container_border_radius);
				document.documentElement.style.setProperty('--board-border-radius', gameState.board_border_radius);
				document.documentElement.style.setProperty('--ball-color-theme', gameState.ball_color_theme);
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


		// Handle key presses
		document.addEventListener('keydown', (e) => {
			keysPressed[e.key] = true;
			handleKeyPresses();
		});
		document.addEventListener('keyup', (e) => {
			keysPressed[e.key] = false;
			handleKeyPresses();
		});

		function handleKeyPresses() {
			if (keysPressed['Enter']) {
				socket.send(JSON.stringify({ type: 'start' }));
				message.innerHTML = '';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			}
			if (keysPressed['q']) {
				socket.send(JSON.stringify({ type: 'quit' }));
			}
			if (keysPressed['t']) {
				socket.send(JSON.stringify({ type: 'theme' }));
			}

			if (keysPressed['w'] && !keysPressed['s']) {
				if (!paddle1Interval) {
					clearInterval(paddle1Interval);
					paddle1Interval = setInterval(() => {
						socket.send(JSON.stringify({ type: 'move', player: 1, direction: -1 }));
					}, 10);
				}
			} else if (keysPressed['s'] && !keysPressed['w']) {
				if (!paddle1Interval) {
					clearInterval(paddle1Interval);
					paddle1Interval = setInterval(() => {
						socket.send(JSON.stringify({ type: 'move', player: 1, direction: 1 }));
					}, 10);
				}
			} else {
				clearInterval(paddle1Interval);
				paddle1Interval = null;
			}

			if (keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) {
				if (!paddle2Interval) {
					clearInterval(paddle2Interval);
					paddle2Interval = setInterval(() => {
						socket.send(JSON.stringify({ type: 'move', player: 2, direction: -1 }));
					}, 10);
				}
			} else if (keysPressed['ArrowDown'] && !keysPressed['ArrowUp']) {
				if (!paddle2Interval) {
					clearInterval(paddle2Interval);
					paddle2Interval = setInterval(() => {
						socket.send(JSON.stringify({ type: 'move', player: 2, direction: 1 }));
					}, 10);
				}
			} else {
				clearInterval(paddle2Interval);
				paddle2Interval = null;
			}
		}

		function updateGameConfig(gameState) {
			p_1_name.innerHTML = `${gameState.player_1_name}`;
			p_2_name.innerHTML = `${gameState.player_2_name}`;
			win_goals.innerHTML = gameState.goals_to_win + ' (dif.' + gameState.goals_diff + ')';
		}
		function updatePositions(gameState) {
			let responsiveValue = getComputedStyle(document.documentElement).getPropertyValue('--responsive');
			ball.style.left = `${gameState.ball_x * responsiveValue}px`;
			ball.style.top = `${gameState.ball_y * responsiveValue}px`;
			p_1_paddle.style.top = `${gameState.pad_1_y * responsiveValue}px`;
			p_2_paddle.style.top = `${gameState.pad_2_y * responsiveValue}px`;
		}

		function updateScore(gameState) {
			p_1_score.innerHTML = `${gameState.score_1}`;
			p_2_score.innerHTML = `${gameState.score_2}`;
		}

		function updateGameState(gameState) {
			if (gameState.state === 'playing') {
				message.innerHTML = '';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			} else if (gameState.state === 'ready') {
				message.innerHTML = 'Press Enter to start the game';
				controls_1.innerHTML = 'Player 1: W, S';
				controls_2.innerHTML = 'Player 2: Arrow Up, Arrow Down';
			} else if (gameState.state === 'countdown') {
				message.innerHTML = `Ready in ${gameState.countdown}...`;
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			} else if (gameState.state === 'game_over') {
				message.innerHTML = 'Game Over';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			}
		}
	}
}
