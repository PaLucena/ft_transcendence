import DualControl from './DualControl.js';
import SoloControl from './SoloControl.js';

export class InputController {
    constructor(socket, controls_mode, controls_side) {
        this.controls_mode = controls_mode;
        this.controls_side = controls_side;

        console.log("control: " + this.controls_mode);

        this.gameSocket = socket;
        this.controlModule = null;
        this.configureControls();
    }

    configureControls() {
        switch (this.controls_mode) {
            case 'local':
                console.log("Controls for 2 players in same keyboard");
                this.controlModule = new DualControl(this.execCommands.bind(this));
                break;
            case 'remote':
                console.log("Controls for 1 players in remote mode");
                this.controlModule = new SoloControl(this.execCommands.bind(this), this.controls_side);
                break;
            case 'AI':
                console.log("Controls for 1 player with AI opponent");
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
                this.gameSocket.send(JSON.stringify({ type: 'player_ready', player: 1 }));
                break;
            case 'player_2_ready':
                this.gameSocket.send(JSON.stringify({ type: 'player_ready', player: 2 }));
                break;
            case 'quit_p1':
                this.gameSocket.send(JSON.stringify({ type: 'quit', player: 1 }));
                break;
            case 'quit_p2':
                this.gameSocket.send(JSON.stringify({ type: 'quit', player: 2 }));
                break;
            case 'player_1_up':
                this.gameSocket.send(JSON.stringify({ type: 'move', player: 1, direction: -1 }));
                break;
            case 'player_1_down':
                this.gameSocket.send(JSON.stringify({ type: 'move', player: 1, direction: 1 }));
                break;
            case 'player_2_up':
                this.gameSocket.send(JSON.stringify({ type: 'move', player: 2, direction: -1 }));
                break;
            case 'player_2_down':
                this.gameSocket.send(JSON.stringify({ type: 'move', player: 2, direction: 1 }));
                break;
            default:
                break;
        }
    }
}
