// Read info from CSS variables
let paddle_1 = document.querySelector('.paddle_1');
let player1_name = document.querySelector('.player1_name');
let paddle_2 = document.querySelector('.paddle_2');
let player2_name = document.querySelector('.player2_name');
let board = document.querySelector('.board');
let ball = document.querySelector('.ball');
let ball_effect = document.querySelector('.ball_effect');
let score_1 = document.querySelector('.score_1');
let score_2 = document.querySelector('.score_2');
let avatar_1 = document.querySelector('.avatar_1');
let avatar_2 = document.querySelector('.avatar_2');
let message = document.querySelector('.message');
let controls_1 = document.querySelector('.controls_1');
let controls_2 = document.querySelector('.controls_2');
let paddle_1_coord = paddle_1.getBoundingClientRect();
let paddle_2_coord = paddle_2.getBoundingClientRect();
let initial_ball_coord = ball.getBoundingClientRect();
let paddle_common = document.querySelector('.paddle').getBoundingClientRect();
let vx = 6;
let vy = 6;
let dx = Math.random() < 0.5 ? -1 : 1;
let dy = Math.random() < 0.5 ? -1 : 1;


let gameState = 'ready';

let player1_color = getComputedStyle(document.documentElement).getPropertyValue('--p1-color');
let player2_color = getComputedStyle(document.documentElement).getPropertyValue('--p2-color');
let ball_color = getComputedStyle(document.documentElement).getPropertyValue('--ball-color');

// Game settings
let goals2win = 5;
let goal_dif = 2;
let init_velocity = 6;
let inc_velocity = 0.5;
let paddle_margin = 35;

// Game settings (applying in frontend)
let goals = document.querySelector('.goals');
goals.innerHTML = `${goals2win} + ${goal_dif}`;


let paddle1Interval;
let paddle2Interval;
let score_1_value = 0;
let player1_hits = 0;
let score_2_value = 0;
let player2_hits = 0;

let keysPressed = {};


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
            gameState = 'playing';
            message.innerHTML = '';
            controls_1.innerHTML = '<br><br>';
            controls_2.innerHTML = '<br><br>';
            resetGame();
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
        if (!paddle1Interval) {
            clearInterval(paddle1Interval);
            paddle1Interval = setInterval(() => movePaddle(paddle_1, -1), 10);
        }
    } else if (keysPressed['s'] && !keysPressed['w']) {
        if (!paddle1Interval) {
            clearInterval(paddle1Interval);
            paddle1Interval = setInterval(() => movePaddle(paddle_1, 1), 10);
        }
    } else {
        clearInterval(paddle1Interval);
        paddle1Interval = null;
    }

    if (keysPressed['ArrowUp'] && !keysPressed['ArrowDown']) {
        if (!paddle2Interval) {
            clearInterval(paddle2Interval);
            paddle2Interval = setInterval(() => movePaddle(paddle_2, -1), 10);
        }
    } else if (keysPressed['ArrowDown'] && !keysPressed['ArrowUp']) {
        if (!paddle2Interval) {
            clearInterval(paddle2Interval);
            paddle2Interval = setInterval(() => movePaddle(paddle_2, 1), 10);
        }
    } else {
        clearInterval(paddle2Interval);
        paddle2Interval = null;
    }
}

function movePaddle(paddle, direction) {
    let paddle_coord = paddle.getBoundingClientRect();
    if (direction === -1)
        paddle.style.top = Math.max(
            board.getBoundingClientRect().top + paddle_margin,
            paddle_coord.top + direction * window.innerHeight * 0.004) + 'px';
    else
        paddle.style.top = Math.min(
            board.getBoundingClientRect().bottom - paddle_common.height - paddle_margin,
            paddle_coord.top + direction * window.innerHeight * 0.004) + 'px';
}

function moveBall()
{
    if (gameState !== 'playing')
        return;

    let ball_coord = ball.getBoundingClientRect();
    let board_coord = board.getBoundingClientRect();

    paddle_1_coord = paddle_1.getBoundingClientRect();
    paddle_2_coord = paddle_2.getBoundingClientRect();

    if (ball_coord.top <= board_coord.top || ball_coord.bottom >= board_coord.bottom)
        dy *= -1;

    if (
        ball_coord.left <= paddle_1_coord.right &&
        ball_coord.right >= paddle_1_coord.left &&
        ball_coord.top <= paddle_1_coord.bottom &&
        ball_coord.bottom >= paddle_1_coord.top
    ) {
        let impactPoint = (ball_coord.top + ball_coord.bottom) / 2 - paddle_1_coord.top;
        let relativeImpact = (impactPoint / paddle_1_coord.height) - 0.5;
        dy = relativeImpact * 2;
        dx *= -1;
        player1_hits++;
        increaseSpeed();
    }
    if (ball_coord.left <= paddle_2_coord.right &&
        ball_coord.right >= paddle_2_coord.left &&
        ball_coord.top <= paddle_2_coord.bottom &&
        ball_coord.bottom >= paddle_2_coord.top
    ) {
        let impactPoint = (ball_coord.top + ball_coord.bottom) / 2 - paddle_2_coord.top;
        let relativeImpact = (impactPoint / paddle_2_coord.height) - 0.5;
        dy = relativeImpact * 2;
        dx *= -1;
        player2_hits++;
        increaseSpeed();
    }

    if (ball_coord.left <= board_coord.left + 20 || ball_coord.right >= board_coord.right - 20) {
        if (ball_coord.left <= paddle_1_coord.right) {
            score_2_value++;
            score_2.innerHTML = `${score_2_value}`;
        } else {
            score_1_value++;
            score_1.innerHTML = `${score_1_value}`;
        }
        if (score_1_value >= goals2win && score_1_value - score_2_value >= goal_dif) {
            gameState = 'gameover';
            message.innerHTML = `PLAYER 1 WINS!!<br>(hits: ${player1_hits})<br><br>Enter to restart`;
            return;
        }
        if (score_2_value >= goals2win && score_2_value - score_1_value >= goal_dif) {
            gameState = 'gameover';
            message.innerHTML = `PLAYER 2 WINS!!<br>(hits: ${player2_hits})<br><br>Enter to restart`;
            return;
        }
        if (score_1_value >= goals2win - 1 && score_1_value - score_2_value >= goal_dif - 1) {
            ball_effect.style.boxShadow = `inset 0 0 20px #fff, 0 0 20px ${player1_color}`;
        } else if (score_2_value >= goals2win - 1 && score_2_value - score_1_value >= goal_dif - 1) {
            ball_effect.style.boxShadow = `inset 0 0 20px #fff, 0 0 20px ${player2_color}`;
        } else {
            ball_effect.style.boxShadow = `inset 0 0 20px ${ball_color}`;
        }
        resetGame();
        return;
    }

    ball.style.top = ball_coord.top + vy * dy + 'px';
    ball.style.left = ball_coord.left + vx * dx + 'px';

    requestAnimationFrame(() => moveBall());
}

function increaseSpeed() {
    vx += inc_velocity;
    vy += inc_velocity;
}

function resetGame() {
    ball.style.top = `${initial_ball_coord.top}` + 'px';
    ball.style.left = `${initial_ball_coord.left}` + 'px';

    vx = init_velocity;
    vy = init_velocity;
    dx = Math.random() < 0.5 ? -1 : 1;
    dy = Math.random() < 0.5 ? -1 : 1;

    let countdown = 4;

    let countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            message.innerHTML = `Ready in ${countdown} ...`;
        } else {
            clearInterval(countdownInterval);
            message.innerHTML = '';
            gameState = 'playing';
            requestAnimationFrame(() => moveBall());
        }
    }, 1000);
}
