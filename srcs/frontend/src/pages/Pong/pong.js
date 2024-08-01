

function initPong() {
    // Game settings
    const goals_win = 6;
    const goals_diff = 2;
    let ball_init_vel = 3;
    let ball_inc_vel = 0.5;
    let paddle_margin = 35;
	let paddle_speed = 4;
	const countdown = 3;

    // Variables
    let p_1_score_value = 0;
    let p_1_hits = 0;
    let p_2_score_value = 0;
    let p_2_hits = 0;
    let keysPressed = {};
    let gameState = 'ready';

    // Backend - Players elements
    // TODO
    let name_1 = 'Player 1';
    let name_2 = 'Player 2';

	// Capture - responsive value
	let responsiveValue = getComputedStyle(document.documentElement).getPropertyValue('--responsive');
    // Capture - CSS environment
    const p_1_color = getComputedStyle(document.documentElement).getPropertyValue('--p1-color');
    const p_2_color = getComputedStyle(document.documentElement).getPropertyValue('--p2-color');
    const ball_color = getComputedStyle(document.documentElement).getPropertyValue('--ball-color');
    // Capture - Containers
    const container = document.querySelector('.container');
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
    win_goals.innerHTML = `${goals_win} (dif.${goals_diff})`;
    let vel_x = ball_init_vel;
    let vel_y = ball_init_vel;

    // Config - Ball initial direction
    let dir_x = Math.random() < 0.5 ? -1 : 1;
    let dir_y = Math.random() < 0.5 ? -1 : 1;


    // Paddles movement
    let paddle_1_interval;
    let paddle_2_interval;

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
			if (gameState === 'ready') {
				resetGame();
				gameState = 'playing';
				message.innerHTML = '';
				controls_1.innerHTML = '';
				controls_2.innerHTML = '';
			}
			if (gameState === 'gameover') {
				gameState = 'ready';
				ball_effect.style.boxShadow = 'inset 0 0 20px #fff';
				score_1_value = 0;
				score_1.innerHTML = `${score_1_value}`;
				score_2_value = 0;
				score_2.innerHTML = `${score_2_value}`;
				resetGame();
			}
		}

		if (keysPressed['w'] && !keysPressed['s']) {
			if (!paddle_1_interval) {
				clearInterval(paddle_1_interval);
				paddle_1_interval = setInterval(() => movePaddle(p_1_paddle, -1), 10);
			}
		} else if (keysPressed['s'] && !keysPressed['w']) {
			if (!paddle_1_interval) {
				clearInterval(paddle_1_interval);
				paddle_1_interval = setInterval(() => movePaddle(p_1_paddle, 1), 10);
			}
		} else {
			clearInterval(paddle_1_interval);
			paddle_1_interval = null;
		}

		if (keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) {
			if (!paddle_2_interval) {
				clearInterval(paddle_2_interval);
				paddle_2_interval = setInterval(() => movePaddle(p_2_paddle, -1), 10);
			}
		} else if (keysPressed['ArrowDown'] && !keysPressed['ArrowUp']) {
			if (!paddle_2_interval) {
				clearInterval(paddle_2_interval);
				paddle_2_interval = setInterval(() => movePaddle(p_2_paddle, 1), 10);
			}
		} else {
			clearInterval(paddle_2_interval);
			paddle_2_interval = null;
		}
	}

    function movePaddle(paddle, direction) {
		const boardHeight = board.offsetHeight;
        const paddleHeight = paddle.offsetHeight;
        const paddleTop = paddle.offsetTop;
        if (direction === -1) {
			paddle.style.top = Math.max(
				(paddleTop - paddle_speed) * responsiveValue,
                paddle_margin * responsiveValue) + 'px';
        } else {
            paddle.style.top = Math.min(
				(paddleTop + paddle_speed) * responsiveValue,
                (boardHeight - paddleHeight - paddle_margin) * responsiveValue) + 'px';
        }
	}

	function moveBall()
	{
		if (gameState !== 'playing')
			return;

		let ball_coord = ball.getBoundingClientRect();
		let board_coord = board.getBoundingClientRect();

		let paddle_1_coord = p_1_paddle.getBoundingClientRect();
		let paddle_2_coord = p_2_paddle.getBoundingClientRect();

		if (ball_coord.top <= board_coord.top || ball_coord.bottom >= board_coord.bottom)
			dir_y *= -1;

		if (
			ball_coord.left <= paddle_1_coord.right &&
			ball_coord.right >= paddle_1_coord.left &&
			ball_coord.top <= paddle_1_coord.bottom &&
			ball_coord.bottom >= paddle_1_coord.top
		) {
			let impactPoint = (ball_coord.top + ball_coord.bottom) / 2 - paddle_1_coord.top;
			let relativeImpact = (impactPoint / paddle_1_coord.height) - 0.5;
			dir_y = relativeImpact * 2;
			dir_x *= -1;
			p_1_hits++;
			increaseSpeed();
		}
		if (ball_coord.left <= paddle_2_coord.right &&
			ball_coord.right >= paddle_2_coord.left &&
			ball_coord.top <= paddle_2_coord.bottom &&
			ball_coord.bottom >= paddle_2_coord.top
		) {
			let impactPoint = (ball_coord.top + ball_coord.bottom) / 2 - paddle_2_coord.top;
			let relativeImpact = (impactPoint / paddle_2_coord.height) - 0.5;
			dir_y = relativeImpact * 2;
			dir_x *= -1;
			p_2_hits++;
			increaseSpeed();
		}

		if (ball_coord.left <= board_coord.left + 20 || ball_coord.right >= board_coord.right - 20) {
			if (ball_coord.left <= paddle_1_coord.right) {
				p_2_score_value++;
				p_2_score.innerHTML = `${p_2_score_value}`;
			} else {
				p_1_score_value++;
				p_1_score.innerHTML = `${p_1_score_value}`;
			}
			if (p_1_score_value >= goals_win && p_1_score_value - p_2_score_value >= goals_diff) {
				gameState = 'gameover';
				message.innerHTML = `PLAYER 1 WINS!!<br>(hits: ${p_1_hits})<br><br>Enter to restart`;
				return;
			}
			if (p_2_score_value >= goals_win && p_2_score_value - p_1_score_value >= goals_diff) {
				gameState = 'gameover';
				message.innerHTML = `PLAYER 2 WINS!!<br>(hits: ${p_2_hits})<br><br>Enter to restart`;
				return;
			}
			if (p_1_score_value >= goals_win - 1 && p_1_score_value - p_2_score_value >= goals_diff - 1) {
				ball_effect.style.boxShadow = `inset 0 0 20px #fff, 0 0 20px ${p_1_color}`;
			} else if (p_2_score_value >= goals_win - 1 && p_2_score_value - p_1_score_value >= goals_diff - 1) {
				ball_effect.style.boxShadow = `inset 0 0 20px #fff, 0 0 20px ${p_2_color}`;
			} else {
				ball_effect.style.boxShadow = `inset 0 0 20px ${ball_color}`;
			}
			resetGame();
			return;
		}

		ball.style.top = (ball_coord.top - board_coord.top + dir_y * vel_y) + 'px';
		ball.style.left = (ball_coord.left - board_coord.left + dir_x * vel_x) + 'px';

		requestAnimationFrame(() => moveBall());
	}

	function increaseSpeed() {
		vel_x += ball_inc_vel;
		vel_y += ball_inc_vel;
	}

	function resetGame() {
		let board_coord = board.getBoundingClientRect();
		ball.style.top = (board_coord.height / 2 - ball.offsetHeight / 2) + 'px';
		ball.style.left = (board_coord.width / 2 - ball.offsetWidth / 2) + 'px';

		vel_x = ball_init_vel;
		vel_y = ball_init_vel;
		dir_x = Math.random() < 0.5 ? -1 : 1;
		dir_y = Math.random() < 0.5 ? -1 : 1;

		let count = countdown + 1;

		let countdownInterval = setInterval(() => {
			count--;
			if (count > 0) {
				message.innerHTML = `Ready in ${count} ...`;
			} else {
				clearInterval(countdownInterval);
				message.innerHTML = '';
				gameState = 'playing';
				requestAnimationFrame(() => moveBall());
			}
		}, 1000);
	}



	function updateResizePositions() {
        let NewResponsiveValue = getComputedStyle(document.documentElement).getPropertyValue('--responsive');
        if (responsiveValue !== NewResponsiveValue) {
			let factor = NewResponsiveValue / responsiveValue;
			responsiveValue = NewResponsiveValue;
			const p1_top = p_1_paddle.offsetTop;
			p_1_paddle.style.top = `${p1_top * factor}px`;
			const p2_top = p_2_paddle.offsetTop;
			p_2_paddle.style.top = `${p2_top * factor}px`;
			const ball_top = ball.offsetTop;
			ball.style.top = `${ball_top * factor}px`;
			const ball_left = ball.offsetLeft;
			ball.style.left = `${ball_left * factor}px`;
		}
    }

    window.addEventListener('resize', updateResizePositions);
}

