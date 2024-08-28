import DualControl from './DualControl.js';
import SoloControl from './SoloControl.js';

export class InputController {
    constructor(socket, controls_mode, controls_side) {
        // Receive values from the backend
        this.controls_mode = controls_mode;
        this.controls_side = controls_side;

        console.log("control: " + this.controls_mode);

        this.socket = socket;
        this.controlModule = null;
        this.configureControls();
    }

    configureControls() {
        switch (this.controls_mode) {
            case 'local':
                this.controlModule = new DualControl(this.execCommands.bind(this));
                break;
            case 'solo':
                this.controlModule = new SoloControl(this.execCommands.bind(this), this.controls_side);
                break;
            default:
                this.controlModule = new DualControl(this.execCommands.bind(this));
                break;
        }
        if (this.controlModule) {
            this.controlModule.init();
        }
    }
    execCommands(command) {
        switch (command) {
            case 'player_1_ready':
                this.socket.send(JSON.stringify({ type: 'player_ready', player: 1 }));
                break;
            case 'player_2_ready':
                this.socket.send(JSON.stringify({ type: 'player_ready', player: 2 }));
                break;
            case 'quit':
                this.socket.send(JSON.stringify({ type: 'quit' }));
                break;
            case 'player_1_up':
                this.socket.send(JSON.stringify({ type: 'move', player: 1, direction: -1 }));
                break;
            case 'player_1_down':
                this.socket.send(JSON.stringify({ type: 'move', player: 1, direction: 1 }));
                break;
            case 'player_2_up':
                this.socket.send(JSON.stringify({ type: 'move', player: 2, direction: -1 }));
                break;
            case 'player_2_down':
                this.socket.send(JSON.stringify({ type: 'move', player: 2, direction: 1 }));
                break;
            default:
                break;
        }
    }
}
