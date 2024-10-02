import {navigateTo} from "../../scripts/Router.js";
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
                if (window.location.pathname === '/play') {
                    console.log("Main room update: public ", data);
                    Play.displayTournaments(data.public_tournaments, data.private_tournaments, data.player_id);
                }
            }

            else if (data.type === 'successfully_joined') {
                console.log("successfully_joined", data);
                navigateTo('/tournament');
                const observer = new MutationObserver((mutations, obs) => {
                    if (document.querySelector('#root_tournament_container')) {
                        setTimeout(() => {
                            Tournament.renderButtons(data.creator_id, data.current_id);
                        }, 0);
                        obs.disconnect();
                    }
                });

                observer.observe(document, {
                    childList: true,
                    subtree: true
                });
            }

            else if (data.type === 'tournament_room_update') {
                if (window.location.pathname === '/tournament') {
                    console.log("Tournament room update:", data);

                    const observer = new MutationObserver((mutations, obs) => {
                        if (document.querySelector('#root_tournament_container')) {
                            setTimeout(() => {
                                Tournament.renderPlayers(data.participants_data);
                            }, 0);
                            obs.disconnect();
                        }
                    });

                    observer.observe(document, {
                        childList: true,
                        subtree: true
                    });
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
