export default class SoloControl {
    constructor(execCommands, player) {
        this.player = player;
        this.execCommands = execCommands;
        this.keysPressed = {};
        this.paddleInterval = null;
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;
            this.handleKeyPresses();
        });
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
            this.handleKeyPresses();
        });
    }

    handleKeyPresses() {
        if (this.keysPressed['Enter']) {
            this.execCommands(`player_${this.player}_ready`);
        }
        if (this.keysPressed['q']) {
            this.execCommands('quit');
        }
        if (this.keysPressed['t']) {
            this.execCommands('change_theme');
        }

        if (this.keysPressed['ArrowUp'] && !this.keysPressed['ArrowDown']) {
            if (!this.paddleInterval) {
                clearInterval(this.paddleInterval);
                this.paddleInterval = setInterval(() => {
                    this.execCommands(`player_${this.player}_up`);
                }, 10);
            }
        } else if (this.keysPressed['ArrowDown'] && !this.keysPressed['ArrowUp']) {
            if (!this.paddleInterval) {
                clearInterval(this.paddleInterval);
                this.paddleInterval = setInterval(() => {
                    this.execCommands(`player_${this.player}_down`);
                }, 10);
            }
        } else {
            clearInterval(this.paddleInterval);
            this.paddleInterval = null;
        }
    }
}
