import { handleResponse, updateOnlineStatus } from './rtchatUtils.js'
import customAlert from './customAlert.js';
import { staticComponentsRenderer } from '../utils/StaticComponentsRenderer.js';
import {pongTournamentSocket} from "../../pages/Tournament/PongTournamentSocket.js";

class UserWebsocket {
    constructor() {
        this.socket = null;
    }

    initWebSocket() {
        if (this.socket && this.socket.readyState !== WebSocket.CLOSED)
            return;

        try {
            this.socket = new WebSocket('/ws/user-socket/');
        } catch (error) {
            this.handleError(null, 'Failed to create WebSocket', true);
            return;
        }

        this.socket.onmessage = (e) => this.handleMessage(e);
        this.socket.onerror = (e) => {this.handleError(null, e, true);}
        this.socket.onclose = (e) => this.handleClose(e);
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.error) {
                this.handleError(data.errorCode, data.errorMessage);
                return;
            }
            if (data.online_users) {
                updateOnlineStatus(data.online_users);
            } else if (data.notification) {
                this.handleNotification(data.notification);
            } else if (data.invitation_1x1) {
                this.handleInvitation1x1(data.invitation_1x1);
            }
            else {
                this.handleError(null, 'Invalid data format received.', false);
            }
        } catch (error) {
            this.handleError(null, error, false);
        }
    }


    handleInvitation1x1 (data) {
        const chatModalInstance = staticComponentsRenderer.getComponentInstance('ChatModal');

        if (chatModalInstance) {
            switch (data.type) {
                case 'connect':
                    chatModalInstance.chatRenderer.onConnect1x1InitRender(data);
                    chatModalInstance.uiSetup.stopTimer();

                    chatModalInstance.uiSetup.setupTimer(15, () => {
                        chatModalInstance.chatRenderer.hideInviteModal();
                    });
                    break;
                case 'accept':
                    chatModalInstance.chatRenderer.updateStatusClasses1x1(data.players);

                    const playerStatuses = data.players.map(player => player.status);
                    if (playerStatuses.every(status => status === 1)) {

                        chatModalInstance.uiSetup.setupTimer(1, async () => {
                            chatModalInstance.chatRenderer.hideInviteModal();

                            const modalContainer = document.getElementById('match_waiting_modal');
                            const currentUser = modalContainer.getAttribute('data-current-user-1x1');
                            const authorPlayer = data.players.find(player => player.is_author === 1 && player.username === currentUser);

                            if (authorPlayer) {
                                try {
                                    pongTournamentSocket.t_socket.send(JSON.stringify({
                                        type: 'start_single_match',
                                        controls_mode: 'remote',
                                        player_2_id: data.players.find(player => player.id !== authorPlayer.id).id,
                                    }));
                                } catch (error) {
                                    console.error('Failed to send notification:', error);
                                }
                            }
                        });
                    }
                    break ;
                case 'reject':
                    chatModalInstance.chatRenderer.updateStatusClasses1x1(data.players);
                    chatModalInstance.uiSetup.stopTimer();

                    chatModalInstance.uiSetup.setupTimer(1, () => {

                        chatModalInstance.chatRenderer.hideInviteModal();
                    });
                    break;
            }
        } else {
            console.error("ChatModal instance is not initialized");
        }
    }

    handleNotification(notification) {
        switch (notification.type) {
            case 'friend_invite':
                customAlert('info', notification.message, 3000, 'New Friend Request');
                break ;
            case 'friend_accept':
                customAlert('success', notification.message, 3000, 'Friendship Confirmed');
                break ;
            case 'friend_cancel':
                customAlert('danger', notification.message, 3000, 'Friendship Canceled');
                break ;
            case '1x1_invite':
                try {
                    this.socket.send(JSON.stringify({
                        action: 'invitation_1x1',
                        type: 'connect',
                        group_name: notification.message
                    }));
                } catch (error) {
                    console.error('Failed to send notification:', error);
                }
                break ;
        }
    }

    handleClose(event) {
        if (!event.wasClean)
            console.error('Online socket closed unexpectedly:', event.reason || 'Unknown reason');
    }

    handleError(errorCode, errorMessage, close) {
        console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        if (close === true) {
            this.closeWebSocket();
        }
    }

    closeWebSocket() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const userSocket = new UserWebsocket();
