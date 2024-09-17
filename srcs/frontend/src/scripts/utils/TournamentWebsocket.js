class TournamentWebsocket {
    constructor() {
        this.t_socket = null;
        this.reconnectDelay = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }

    initWebSocket(tournament_name) {
        try {
            this.t_socket = new WebSocket(`ws/tournament/${tournament_name}/`);
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket', true);
            return;
        }

        this.t_socket.onerror = (e) => {this.handleError(null, e, true);}
        this.t_socket.onclose = (e) => this.handleClose(e);

    }

    handleClose(event) {
        if (!event.wasClean) {
            console.error('Tournament socket closed unexpectedly:', event.reason || 'Unknown reason');

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds... (Attempt ${this.reconnectAttempts})`);

                setTimeout(() => {
                    this.initWebSocket();
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
