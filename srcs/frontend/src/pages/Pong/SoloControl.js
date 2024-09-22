export default class SoloControl {
    constructor(execCommands, player) {
        this.player = player;
        this.execCommands = execCommands;
        this.keysPressed = {};
        this.paddleInterval = null;
        this.buttons_to_hide = null;

        if (this.player === 1) {
            this.buttons_to_hide = 2;
        } else {
            this.buttons_to_hide = 1;
        }

        this.touchIntervals = {};
        this.touchControls = Array.from(document.querySelectorAll('[data-controls]'));

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            document.body.classList.add('touch-enabled');
            document.getElementById(`p${this.buttons_to_hide}-up`).style.display = 'none';
            document.getElementById(`p${this.buttons_to_hide}-down`).style.display = 'none';
            document.getElementById(`p${this.buttons_to_hide}-ready`).style.display = 'none';
        } else {
            document.body.classList.remove('touch-enabled');
        }
    }

    init() {
        this.initEventListeners();
        this.hydeUnusedControls();
    }

    hydeUnusedControls() {
        if (this.player === 1) {
            this.touchControls.filter(control => control.dataset.controls === 'p2_up' || control.dataset.controls === 'p2_down').forEach(control => {
                control.style.display = 'none';
            });
        } else {
            this.touchControls.filter(control => control.dataset.controls === 'p1_up' || control.dataset.controls === 'p1_down').forEach(control => {
                control.style.display = 'none';
            });
        }
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

        this.touchControls.forEach(control => {
            control.addEventListener('touchstart', () => {
                this.handleTouchStart(control.dataset.controls);
            });
            control.addEventListener('touchend', () => {
                this.handleTouchEnd(control.dataset.controls);
            });
            control.addEventListener('mousedown', () => {
                this.handleTouchStart(control.dataset.controls);
            });
            control.addEventListener('mouseup', () => {
                this.handleTouchEnd(control.dataset.controls);
            });
            control.addEventListener('mouseleave', () => {
                this.handleTouchEnd(control.dataset.controls);
            });
        });
    }

    handleKeyPresses() {
        if (this.keysPressed['Enter']) {
            this.execCommands(`player_${this.player}_ready`);
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

    handleTouchStart(control) {
        switch(control) {
            case 'p1-ready':
                this.execCommands(`player_${this.player}_ready`);
                break;
            case 'p1-up':
                if (!this.touchIntervals['p1-up']) {
                    this.touchIntervals['p1-up'] = setInterval(() => {
                        this.execCommands(`player_${this.player}_up`);
                    }, 10);
                }
                break;
            case 'p1-down':
                if (!this.touchIntervals['p1-down']) {
                    this.touchIntervals['p1-down'] = setInterval(() => {
                        this.execCommands(`player_${this.player}_down`);
                    }, 10);
                }
                break;
            case 'p2-ready':
                this.execCommands(`player_${this.player}_ready`);
                break;
            case 'p2-up':
                if (!this.touchIntervals['p2-up']) {
                    this.touchIntervals['p2-up'] = setInterval(() => {
                        this.execCommands(`player_${this.player}_up`);
                    }, 10);
                }
                break;
            case 'p2-down':
                if (!this.touchIntervals['p2-down']) {
                    this.touchIntervals['p2-down'] = setInterval(() => {
                        this.execCommands(`player_${this.player}_down`);
                    }, 10);
                }
                break;
        }
    }

    handleTouchEnd(control) {
        clearInterval(this.touchIntervals[control]);
        this.touchIntervals[control] = null;
    }
}
