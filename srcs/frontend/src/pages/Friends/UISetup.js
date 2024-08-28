import customAlert from '../../scripts/utils/customAlert.js';

export class UISetup {
    constructor(friends) {
        this.friends = friends;
    }

    setupFilterButtons() {
        const filterContainer = document.getElementById('search_filter_btn_container');

        if (filterContainer) {
            this.friends.addEventListener(filterContainer, 'click', async (event) => {
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
            console.warn("Filter buttons container not found");
        }
    }

    // setupFriendButtons() {
    //     const container = document.getElementById('friends_elemets_container');

    //     if (container) {
    //         this.friends.addEventListener(container, 'click', async (event) => {
    //             console.log(event.target);

    //             const targetButton = event.target.closest('button[data-action]');

    //             if (targetButton) {
    //                 const action = targetButton.getAttribute('data-action');
    //                 const username = targetButton.getAttribute('data-username');

    //                 if (action && username) {
    //                     await this.handleFriendAction(action, username);
    //                 }
    //             }
    //         });
    //     } else {
    //         console.warn("Friends elements container not found");
    //     }
    // }

    // async handleFriendAction(action, username) {
    //     try {
    //         const response = await fetch(`/api/friends/${action === 'add' ? 'invite_friend' : 'remove_friend'}/`, {
    //             method: 'POST',
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             credentials: 'include',
    //             body: JSON.stringify({ username })
    //         });

    //         if (response.ok) {
    //             const result = await response.json();
    //             customAlert('success', result.message, 5000);
    //             await this.friends.friendsLoader.loadFriendsData(window.location.pathname.split('/').pop());
    //         } else {
    //             const error = await response.json();
    //             customAlert('danger', error.error, 5000);
    //         }
    //     } catch (error) {
    //         customAlert('danger', 'An unexpected error occurred.', 5000);
    //     }
    // }

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
        console.log(this.friends.filter);

    }

    removeOnlineUpdateListeners() {
        if (this.friends.friendsRenderer.onlineUsersUpdatedListener) {
            this.friends.friendsRenderer.eventEmitter.off('onlineUsersUpdated', this.friends.friendsRenderer.onlineUsersUpdatedListener);
        }
    }
}
