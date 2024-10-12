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
                        navigateTo(`/tournament/${data.tournament_id}`);
                    }
                    break;

                case 'tournament_data':
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        Tournament.renderPlayers(data.participants_data, data.players, data.tournament_name, data.current_phase);
                        if (!data.players.includes(data.user_id)) {
                            navigateTo(`/play`);
                        }
                    }
                    break;

                case 'start_match':
                    if (data.sub_type === 'start_match') {
                        customAlert('info', `Match starting in 5 seconds. Redirecting...`, 5000);
                        setTimeout(() => {
                            navigateTo(`/pong`);}, 5000);
                    }
                    else if (data.sub_type === 'start_single_match') {
                        setTimeout(() => {
                            navigateTo(`/pong`);}, 100);
                    }
                    else if (data.sub_type === 'back_to_game') {
                        setTimeout(() => {
                            navigateTo(`/pong`);}, 100);
                    }
                    break;

                case 'leave_tournament':
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `You have left ${data.tournament_name} tournament.`, 3000);
                    break;

                case 'closed_tournament':
                    const btnContainer = document.getElementById('root_tournament_btn_container');
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                    }
                    break;

                case 'deleted_tournament':
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `Tournament "${data.tournament_name}" has been deleted.`, 3000);
                    break;

                case 'end_tournament':
                    if (window.location.pathname === `/tournament/${data.tournament_id}`) {
                        navigateTo(`/play`);
                    }
                    customAlert('info', `Tournament "${data.tournament_name}" has ended. Winner: ${data.winner}`, 5000);
                    break;

                case 'reload_play':
                    const backToGameBtn = document.getElementById("backToGameBtn")
                    if (backToGameBtn)
                        backToGameBtn.style.display = "none";
                    break;

                case 'eliminated_players':
                    customAlert('info', `You have been eliminated from:\n"${data.tournament_name}"`, 5000);
                    break;

                case 'error':
                    customAlert('danger', data.message, 5000);
                    break;

                default:
                    // console.log('Unknown message type:', data.type);
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
