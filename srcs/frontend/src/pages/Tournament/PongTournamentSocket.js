import {navigateTo} from "../../scripts/Router.js";
import customAlert from "../../scripts/utils/customAlert.js";
import { Play } from "../Play/Play.js";
import { Tournament } from "./Tournament.js";

class PongTournamentSocket {
    constructor() {
        this.t_socket = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }

    initWebSocket() {
        if (this.t_socket && this.t_socket.readyState !== WebSocket.CLOSED)
            return;

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
                customAlert('danger', data.message, 5000);
            }

            else if (data.type === 'main_room_update') {
                if (window.location.pathname === '/play') {
                    console.log("Main room update: public ", data);
                    Play.displayTournaments(data.public_tournaments, data.private_tournaments, data.player_id);
                }
            }

            else if (data.type === 'successfully_joined') {
                if (window.location.pathname === '/play') {
                    console.log("successfully_joined", data);
                    navigateTo(`/tournament/${data.tournament_id}`);
                }
            }

            else if (data.type === 'tournament_room_update') {
                if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                    console.log("Tournament room update:", data);
                    Tournament.renderPlayers(data.participants_data);
                }
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
        }
    }

    closeWebSocket() {
        if (this.t_socket) {
            this.t_socket.close();
            this.t_socket = null;
        }
    }
}

export const pongTournamentSocket = new PongTournamentSocket();
