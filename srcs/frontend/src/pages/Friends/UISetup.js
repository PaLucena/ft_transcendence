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

                    this.updateActiveButton(targetButton);
                    this.updateURL(filter);
                    await this.friends.friendsLoader.loadFriendsData(filter);
                }
            });
        }
        else {
            console.warn("Filter buttons container not found");
        }
    }

    updateActiveButton(activeButton) {
        const buttons = document.querySelectorAll('#search_filter_btn_container .btn');
        buttons.forEach(button => button.classList.remove('active'));
        activeButton.classList.add('active');
    }

    updateURL(filter) {
        const url = new URL(window.location);
        url.pathname = `/friends/${filter}`;
        window.history.pushState({}, '', url);
    }
}
