import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from '../../scripts/utils/customAlert.js';
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';
import { userSocket } from '../../scripts/utils/UserWebsocket.js';

export class UISetup {
    constructor(friends) {
        this.friends = friends;
    }

    setupSearchForm() {
        const searchForm = document.getElementById('friends_search_form');

        if (searchForm) {
            searchForm.onsubmit = async (e) => {
                e.preventDefault();

                const searchInputDom = document.getElementById('friends_search_input');
                if (searchInputDom) {
                    const searchValue = searchInputDom.value.trim();

                    try {
                        const response = await fetch(`/api/friends/search/?query=${searchValue}&filter=${this.friends.filter}`, {
                            method: 'GET',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: 'include',
                        });

                        await handleResponse(response, data => {
                            this.friends.friendsRenderer.renderUsersElements(data.users);
                        });

                    } catch (error) {
                        this.handleError(error.errorCode, error.errorMessage || 'An unexpected error occurred.');
                    }
                } else {
                    console.warn("chat_message_input not found.");
                }
            };
        } else {
            console.warn("chat_message_form not found.");
        }
    }

    removeSearchFormEvents() {
        const searchForm = document.getElementById('friends_search_form');

        if (searchForm) {
            searchForm.onsubmit = null;
        } else {
            console.warn('friends_search_form not found.')
        }
    }

    setupFilterButtons() {
        const container = document.getElementById('search_filter_btn_container');

        if (container) {
            this.friends.addEventListener(container, 'click', async (event) => {
                const targetButton = event.target.closest('button[data-filter]');

                if (targetButton) {
                    const filter = targetButton.getAttribute('data-filter');
                    const currentPath = window.location.pathname.split('/').pop();

                    if (filter === currentPath) {
                        return;
                    }

                    this.updateURL(filter);
                    await this.friends.friendsLoader.loadFriendsData();
                }
            });
        } else {
            console.warn("search_filter_btn_container not found.");
        }
    }

    setupFriendButtons() {
        const container = document.getElementById('friends_elements_container');

        if (container) {
            this.friends.addEventListener(container, 'click', async (event) => {
                const targetButton = event.target.closest('button[data-action]');

                if (targetButton) {
                    const action = targetButton.getAttribute('data-action');
                    const username = targetButton.getAttribute('data-username');

                    if (action && username) {
                        await this.handleFriendAction(action, username);
                    }
                }
            });
        } else {
            console.warn("friends_elements_container not found");
        }
    }

    async handleFriendAction(action, username) {
        try {
            let endpoint;
            let notification_type;

            switch (action) {
                case 'invite':
                    endpoint = 'invite_friend';
                    notification_type = 'friend_invite';
                    break;
                case 'cancel':
                    endpoint = 'remove_friend';
                    notification_type = 'friend_cancel';
                    break;
                case 'remove':
                    endpoint = 'remove_friend';
                    break;
                case 'accept':
                    endpoint = 'accept_invitation';
                    notification_type = 'friend_accept';
                    break;
                default:
                    throw { errorCode: 400, errorMessage: 'Invalid action type' };
            }

            const response = await fetch(`/api/friends/action/${endpoint}/`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({ username })
            });

            await handleResponse(response, async () => {
                if (username && notification_type) {
                    try {
                        userSocket.socket.send(JSON.stringify({
                            action: 'notification',
                            type: notification_type,
                            to_user: username
                        }));
                    } catch (error) {
                        console.error('Failed to send notification:', error);
                    }
                }
                await this.friends.friendsLoader.loadFriendsData(window.location.pathname.split('/').pop());
            });

        } catch (error) {
            this.handleError(error.errorCode, error.errorMessage || 'An unexpected error occurred.');
        }
    }

    updateActiveButtonByFilter(filter) {
        const buttons = document.querySelectorAll('#search_filter_btn_container .btn');
        buttons.forEach(button => {
            if (button.getAttribute('data-filter') === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    updateURL(filter) {
        const url = new URL(window.location);
        url.pathname = `/friends/${filter}`;
        window.history.pushState({}, '', url);
        this.updateFilter(filter);
    }

    updateFilter(data) {
        this.friends.filter = data;
    }

    removeOnlineUpdateListeners() {
        if (this.friends.friendsRenderer.onlineUsersUpdatedListener) {
            this.friends.friendsRenderer.eventEmitter.off('onlineUsersUpdated', this.friends.friendsRenderer.onlineUsersUpdatedListener);
        }
    }

    handleError(errorCode, errorMessage) {
        switch (errorCode) {
            case 401:
                customAlert('danger', 'You are not authenticated. Please log in.', 5000);
                break;
            case 404:
                customAlert('danger', `${errorCode}: ${errorMessage || 'Not found'}`, 5000);
                break;
            case 409:
                customAlert('danger', `${errorCode}: ${errorMessage}.`, 5000);
                break;
            case 500:
                customAlert('danger', 'An internal server error occurred.', 5000);
                break;
            default:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        }
    }
}
