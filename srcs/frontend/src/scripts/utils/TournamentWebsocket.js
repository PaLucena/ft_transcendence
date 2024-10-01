import { Tournament } from "../../pages/Tournament/Tournament.js";
import { navigateTo } from "../Router.js";

class TournamentWebsocket {
    constructor() {
        this.t_socket = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }

    initWebSocket(tournament_name) {
        if (this.t_socket && this.t_socket.readyState === WebSocket.OPEN) {
            console.log("WebSocket is already open, no need to create a new one.");
        }
        else {
            try {
                this.t_socket = new WebSocket(`/ws/tournament/${tournament_name}/`);
            } catch (error) {
                this.handleError(null, 'Failed to create WebSocket', true);
                return;
            }
        }

        this.t_socket.onmessage = (e) => this.handleMessage(e);
        this.t_socket.onerror = (e) => {this.handleError(null, e, true);}
        this.t_socket.onclose = (e) => this.handleClose(e);

    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            console.log("DATA in handle message: ", data);
            
            if (data.error) {
                this.handleError(data.errorCode, data.errorMessage);
                return;
            }
            if (data.tournament_users) {
                Tournament.renderPlayers(data.tournament_users);
            }
            if (data.action == "players_ready") {
                console.log("NAVIGATING TO PONG");
                navigateTo("/pong");
            }
            if (data.action == "players_done") {
                fetch("/api/check_user_id/", {
					method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
					credentials: 'include',
                    body: JSON.stringify({"id": data.id})
				})
				.then(response => {
					if (!response.ok) {
						return response.json().then(errData => {
							throw new Error(errData.error || `Response status: ${response.status}`);
						});
					}
					return response.json();
				})
				.then(data => {
					if (data["result"] == true) {
                        console.log("NAVIGATING TO PLAY");
                        navigateTo("/play");
					}
				})
            }
        } catch (error) {
            this.handleError(null, error, false);
        }
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

    handleError(errorCode, errorMessage, close) {
        console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        if (close === true) {
            this.closeWebSocket();
        }
    }

    closeWebSocket() {
        if (this.t_socket) {
            this.t_socket.close();
            this.t_socket = null;
        }

    }
}

export const tournamentSocket = new TournamentWebsocket();
