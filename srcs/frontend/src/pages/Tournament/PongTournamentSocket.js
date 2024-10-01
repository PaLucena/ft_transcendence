import {navigateTo} from "../../scripts/Router.js";
import { Play } from "../Play/Play.js";


class PongTournamentSocket {
    constructor() {
        this.t_socket = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;

        this.public_tournaments = [];
        this.private_tournaments = [];
    }

    initWebSocket() {
        try {
            this.t_socket = new WebSocket(`/ws/pongtournament/`);
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket', true);
            return;
        }

        this.t_socket.onmessage = (e) => this.handleMessage(e);
        this.t_socket.onerror = (e) => {this.handleError(null, e, true);}
        this.t_socket.onclose = (e) => this.handleClose(e);

    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'error') {
                this.handleError(data.errorCode, data.message);
            }

            else if (data.type === 'main_room_update') {
                console.log("Main room update: public ", data.public_tournaments.length, " private", data.private_tournaments.length);
                Play.displayTournaments(data.public_tournaments, data.private_tournaments, data.player_id);
                console.log("Data", data);
            }

            else if (data.type === 'tournament_room_update') {
                console.log("Tournament room update:", data.participants, data.state);
            }

            else if (data.type === 'match_start') {
                console.log("Match starting:", data.match_id, data.message);

                this.notifyPlayerMatchStart(data.match_id, data.message);
            }

            else if (data.type === 'deleted_tournament') {
                console.log("Deleted tournament:", data.tournament_id);
            }

            else if (data.type === 'tournament_ended') {
                console.log("Tournament ended:", data.tournament_id, data.results);
            }

            else {
                console.log("Unknown message type:", data.type);
            }

        } catch (error) {
            this.handleError(null, error, false);
        }
    }

    notifyPlayerMatchStart(match_id, message) {


        alert(`${message}`);

        navigateTo(`/pong/`);
    }


    handleClose(event) {
        if (!event.wasClean) {
            console.error('Tournament socket closed unexpectedly:', event.reason || 'Unknown reason');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds... (Attempt ${this.reconnectAttempts})`);

                setTimeout(() => {
                    //this.initWebSocket();
                }, this.reconnectDelay);
            } else {
                console.error('Maximum reconnect attempts reached. Connection closed.');
            }
        } else {
            console.log('WebSocket connection closed cleanly.');
        }
    }

    handleError(param, failedToCreateWebSocket, b) {
        console.log(param, failedToCreateWebSocket, b);
    }
}

export const pongTournamentSocket = new PongTournamentSocket();