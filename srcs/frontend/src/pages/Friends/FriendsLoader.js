import customAlert from '../../scripts/utils/customAlert.js';
import { handleResponse } from '../../scripts/utils/rtchatUtils.js';

export class FriendsLoader {
    constructor(friends) {
        this.friends = friends;
    }

    async loadFriendsData() {
        try {
            const response = await fetch(`/api/friends/filter/${this.friends.filter}`, {
				method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
			});

			await handleResponse(response, data => {
                this.friends.friendsRenderer.renderUsersElements(data.users);

                this.friends.uiSetup.updateActiveButtonByFilter(this.friends.filter);
            });

        } catch (error) {
			this.handleError(error.errorCode, error.errorMessage);
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
            case 500:
                customAlert('danger', 'An internal server error occurred.', 5000);
                break;
            default:
                console.error(errorCode ? `Error ${errorCode}: ${errorMessage}` : `Critical error: ${errorMessage}`);
        }
    }
}
