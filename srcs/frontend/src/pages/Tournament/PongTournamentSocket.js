import {navigateTo} from "../../scripts/Router.js";
import customAlert from "../../scripts/utils/customAlert.js";
import { Play } from "../Play/Play.js";
import { Tournament } from "./Tournament.js";

class PongTournamentSocket {
    constructor() {
        this.t_socket = null;
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
        this.t_socket.onerror = (e) => this.handleError(null, e, true);
        this.t_socket.onclose = (e) => this.handleClose(e);
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {

                case 'tournaments_list':
                    if (window.location.pathname === '/play') {
                        Play.displayTournaments(data.t_public, data.t_private, data.player_id);
                    }
                    break;

                case 'successfully_joined':
                    if (window.location.pathname === '/play') {
                        console.log("successfully_joined", data);
                        navigateTo(`/tournament/${data.tournament_id}`);
                    }
                    break;

                case 'tournament_data':
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        console.log("Tournament room update:", data);
                        Tournament.renderPlayers(data.participants_data, data.players, data.tournament_name, data.current_phase);
                        if (!data.players.includes(data.user_id)) {
                            console.log("User not in players list. Redirecting...");
                            navigateTo(`/play`);
                        }
                    }
                    break;

                case 'start_match':
                    console.log("Received start_match:", data);
                    customAlert('info', `Match starting in 5 seconds. Redirecting...`, 5000);
                    setTimeout(() => {
                        navigateTo(`/pong`);}, 5000);
                    break;

                case 'notify_left_tournament':
                    console.log("Left tournament:", data.tournament_name);
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `You have been left ${data.tournament_name} tournament.`, 3000);
                    break;

                case 'closed_tournament':
                    console.log("Closed tournament (consumer)");
                    const btnContainer = document.getElementById('root_tournament_btn_container');
                    if (btnContainer) {
                        console.log("Found button container");
                        btnContainer.innerHTML = '';
                    }
                    break;

                case 'deleted_tournament':
                    console.log("Deleted tournament:", data.tournament_name);
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `Tournament "${data.tournament_name}" has been deleted.`, 3000);
                    break;

                case 'end_tournament':
                   console.log("Tournament ended:", data.tournament_id, data.results);
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `Tournament "${data.tournament_name}" has ended. Winner: ${data.winner}`, 5000);
                    break;

                case 'error':
                    customAlert('danger', data.message, 5000);
                    break;

                default:
                    console.log("Unknown message type:", data.type);
                    break;
            }
        } catch (error) {
            this.handleError(null, error, false);
        }
    }


    handleClose(event) {
        if (!event.wasClean) {
            console.error('Tournament socket closed unexpectedly:', event.reason || 'Unknown reason');
        }
    }

    handleError(errorCode, errorMessage, critical) {
        if (critical) {
            console.error('Critical error:', errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        } else {
            console.error('Error:', errorCode ? `Error ${errorCode}: ${errorMessage}` : `Error: ${errorMessage}`);
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
