export default class DualControl {
    constructor(execCommands) {
        this.execCommands = execCommands;
        this.keysPressed = {};
        this.paddle1Interval = null;
        this.paddle2Interval = null;

        this.touchIntervals = {};
        this.touchControls = Array.from(document.querySelectorAll('[data-controls]'));

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            document.body.classList.add('touch-enabled');
        } else {
            document.body.classList.remove('touch-enabled');
        }
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
        if (this.keysPressed[' ']) {
            this.execCommands('player_1_ready');
        }
        if (this.keysPressed['Enter']) {
            this.execCommands('player_2_ready');
        }

        if (this.keysPressed['w'] && !this.keysPressed['s']) {
            if (!this.paddle1Interval) {
                clearInterval(this.paddle1Interval);
                this.paddle1Interval = setInterval(() => {
                    this.execCommands('player_1_up');
                }, 10);
            }
        } else if (this.keysPressed['s'] && !this.keysPressed['w']) {
            if (!this.paddle1Interval) {
                clearInterval(this.paddle1Interval);
                this.paddle1Interval = setInterval(() => {
                    this.execCommands('player_1_down');
                }, 10);
            }
        } else {
            clearInterval(this.paddle1Interval);
            this.paddle1Interval = null;
        }

        if (this.keysPressed['ArrowUp'] && !this.keysPressed['ArrowDown']) {
            if (!this.paddle2Interval) {
                clearInterval(this.paddle2Interval);
                this.paddle2Interval = setInterval(() => {
                    this.execCommands('player_2_up');
                }, 10);
            }
        } else if (this.keysPressed['ArrowDown'] && !this.keysPressed['ArrowUp']) {
            if (!this.paddle2Interval) {
                clearInterval(this.paddle2Interval);
                this.paddle2Interval = setInterval(() => {
                    this.execCommands('player_2_down');
                }, 10);
            }
        } else {
            clearInterval(this.paddle2Interval);
            this.paddle2Interval = null;
        }
    }

    handleTouchStart(control) {
        switch(control) {
            case 'p1_up':
                if (!this.touchIntervals['p1_up']) {
                    this.touchIntervals['p1_up'] = setInterval(() => {
                        this.execCommands('player_1_up');
                    }, 10);
                }
                break;
            case 'p1_down':
                if (!this.touchIntervals['p1_down']) {
                    this.touchIntervals['p1_down'] = setInterval(() => {
                        this.execCommands('player_1_down');
                    }, 10);
                }
                break;
            case 'p2_up':
                if (!this.touchIntervals['p2_up']) {
                    this.touchIntervals['p2_up'] = setInterval(() => {
                        this.execCommands('player_2_up');
                    }, 10);
                }
                break;
            case 'p2_down':
                if (!this.touchIntervals['p2_down']) {
                    this.touchIntervals['p2_down'] = setInterval(() => {
                        this.execCommands('player_2_down');
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
