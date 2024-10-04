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
            else if (data.tournament_users) {
                Tournament.renderPlayers(data.tournament_users);
            }
            else if (data.action == "players_ready") {
                console.log("NAVIGATING TO PONG");
                navigateTo("/pong");
            }
            else if (data.action == "players_done") {
                console.log('IM HEREE!!!');
                const userId = localStorage.getItem('user_id');
                console.log('userId!!! ', userId);
                if (userId && parseInt(userId) === data.id) {
                    console.log('NAVIGATING TO PLAY!!!');
                    navigateTo("/play");
                }
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

async function fetchUserId() {
    try {
        const response = await fetch('/api/check_user_id/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user ID');
        }

        const data = await response.json();
        return data.user_id;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}

fetchUserId().then(userId => {
    if (userId) {
        localStorage.setItem('user_id', userId);
    } else {
        //console.error('Could not store user ID in localStorage');
    }
});

export const tournamentSocket = new TournamentWebsocket();
