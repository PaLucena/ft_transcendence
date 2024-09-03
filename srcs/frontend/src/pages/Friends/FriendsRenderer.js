export class FriendsRenderer {
    constructor(friends) {
        this.friends = friends;
    }

    renderUsersElements(users) {
        const container = document.getElementById('friends_elements_container');

        if (container) {
            container.innerHTML = '';

            users.forEach(user => {
                const userElement = this.createUserElement(user);

                if (userElement) {
                    container.appendChild(userElement);
                }
            });
        } else {
            console.warn("friends_elements_container not found.");
        }
    }

    createUserElement(user) {
        try {
            const filterType = this.friends.filter;

            const showStatusDot = (filterType === 'all' && user.friendship_status === 'accepted') || filterType === 'my_friends';

            const borderClass = this.getBorderClass(filterType, user.friendship_status);

            const statusDotHtml = `
                <div
                    class="status-dot position-absolute translate-middle border border-3 border-dark ${user.is_online ? 'green' : 'gray'}-dot p-2"
                    data-online-username="${user.username}"
                    style="top:90%; left:85%;">
                </div>`;

            const commonHtml = `
                <div class="chat-element col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                    <div class="img-nick">
                        <button id="userBtn-${user.username}" class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                            <img
                                src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                class="${borderClass} border border-2 rounded-circle" alt="Circle Image"
                            >
                            ${showStatusDot ? statusDotHtml : ''}
                        </button>
                        <p class="text-light mt-2 fw-bold">${user.username}</p>
                    </div>
                    ${this.getActionButtons(user, filterType)}
                </div>`;

            const template = document.createElement('template');
            template.innerHTML = commonHtml.trim();

            return template.content.firstChild;
        } catch (error) {
            console.error('Error creating user element:', error);
            return null;
        }
    }

    getBorderClass(filterType, friendshipStatus) {
        if (filterType === 'all') {
            switch (friendshipStatus) {
                case 'accepted':
                    return 'border-success';
                case 'pending':
                    return 'border-warning';
                case 'incoming':
                    return 'border-info';
                case 'no_relation':
                default:
                    return 'border-secondary';
            }
        } else {

            switch (filterType) {
                case 'my_friends':
                    return 'border-success';
                case 'pending_requests':
                    return 'border-warning';
                case 'incoming_requests':
                    return 'border-info';
                default:
                    return 'border-secondary';
            }
        }
    }

    getActionButtons(user, filterType) {
        switch (filterType) {
            case 'all':
                return this.getAllFilterButtons(user);
            case 'my_friends':
                return `<button class="btn btn-outline-light"
                            data-action="remove"
                            data-username="${user.username}">
                        Remove
                    </button>`;
            case 'pending_requests':
                return `<div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                            <button class="btn btn-outline-light"
                                data-action="remove"
                                data-username="${user.username}">
                                Cancel
                            </button>
                        </div>`;
            case 'incoming_requests':
                return `<div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                            <button class="btn btn-light"
                                data-action="accept"
                                data-username="${user.username}">
                                Accept
                            </button>
                            <button class="btn btn-outline-light"
                                data-action="remove"
                                data-username="${user.username}">
                                Cancel
                            </button>
                        </div>`;
            default:
                return 'Something Went Wrong...';
        }
    }

    getAllFilterButtons(user) {
        switch (user.friendship_status) {
            case 'accepted':
                return `<button class="btn btn-outline-light"
                            data-action="remove"
                            data-username="${user.username}">
                        Remove
                    </button>`;
            case 'pending':
                return `<div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                            <button class="btn btn-outline-light"
                                data-action="remove"
                                data-username="${user.username}">
                                Cancel
                            </button>
                        </div>`;
            case 'incoming':
                return `<div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                            <button class="btn btn-light"
                                data-action="accept"
                                data-username="${user.username}">
                                Accept
                            </button>
                            <button class="btn btn-outline-light"
                                data-action="remove"
                                data-username="${user.username}">
                                Cancel
                            </button>
                        </div>`;
            case 'no_relation':
            default:
                return `<button class="btn btn-light"
                            data-action="invite"
                            data-username="${user.username}">
                        Invite
                    </button>`;
        }
    }
}
