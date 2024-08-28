export class FriendsRenderer {
    constructor(friends) {
        this.friends = friends;
    }

    renderUsersElements(users) {
        console.log("USERS: ", users);

        const container = document.getElementById('friends_elemets_container');

        if (container) {
            container.innerHTML = '';

            users.forEach(user => {
                const userElement = this.createUserElement(user);

                if (userElement) {
                    container.appendChild(userElement);
                }
            });
        }
        else {
            console.warn("Friends elements container not found");
        }
    }

    createUserElement(user) {
        try {
            const filterType = this.friends.filter;
            let userHtml;

            if (filterType === 'all') {
                switch (user.friendship_status) {
                    case 'accepted':
                        userHtml = `
                        <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                            <div class="img-nick">
                                <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                                    <img
                                        src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                        class="rounded-circle" alt="Circle Image"
                                    >
                                    <div
                                        class="status-dot position-absolute translate-middle border border-3 border-dark ${user.is_online ? 'green' : 'gray'}-dot p-2"
                                        data-online-username="${user.username}"
                                        style="top:90%; left:85%;"></div>
                                </button>
                                <p class="text-light mt-2 fw-bold">${user.username}</p>
                            </div>
                            <button class="btn btn-outline-danger"
                                    data-action="remove"
                                    data-username="${user.username}">
                                Remove
                            </button>
                        </div>
                        `;
                        break;

                    case 'pending':
                        userHtml = `
                        <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                            <div class="img-nick">
                                <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                                    <img
                                        src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                        class="rounded-circle" alt="Circle Image"
                                    >
                                </button>
                                <p class="text-light mt-2 fw-bold">${user.username}</p>
                            </div>
                            <div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                                <button class="btn btn-outline-danger"
                                        data-action="remove"
                                        data-username="${user.username}">
                                    Cancel
                                </button>
                            </div>
                        </div>
                        `;
                        break;

                    case 'incoming':
                        userHtml = `
                        <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                            <div class="img-nick">
                                <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                                    <img
                                        src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                        class="rounded-circle" alt="Circle Image"
                                    >
                                </button>
                                <p class="text-light mt-2 fw-bold">${user.username}</p>
                            </div>
                            <div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                                <button class="btn btn-outline-success"
                                        data-action="accept"
                                        data-username="${user.username}">
                                    Accept
                                </button>
                                <button class="btn btn-outline-danger"
                                        data-action="remove"
                                        data-username="${user.username}">
                                    Cancel
                                </button>
                            </div>
                        </div>
                        `;
                        break;

                    case 'no_relation':
                    default:
                        userHtml = `
                        <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                            <div class="img-nick">
                                <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                                    <img src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}" class="rounded-circle" alt="Circle Image">
                                </button>
                                <p class="text-light mt-2 fw-bold">${user.username}</p>
                            </div>
                            <button class="btn btn-outline-success"
                                    data-action="invite"
                                    data-username="${user.username}">
                                Invite
                            </button>
                        </div>
                        `;
                        break;
                }
            }
            else if (filterType === 'my_friends') {
                userHtml = `
                <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                    <div class="img-nick">
                        <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                            <img
                                src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                class="rounded-circle" alt="Circle Image"
                            >
                            <div
                                class="status-dot position-absolute translate-middle border border-3 border-dark ${user.is_online ? 'green' : 'gray'}-dot p-2"
                                data-online-username="${user.username}"
							    style="top:90%; left:85%;"></div>
                        </button>
                        <p class="text-light mt-2 fw-bold">${user.username}</p>
                    </div>
                    <button class="btn btn-outline-danger"
                            data-action="remove"
                            data-username="${user.username}">
                        Remove
                    </button>
                </div>
                `;
            }
            else if (filterType === 'pending_requests') {
                userHtml = `
                <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                    <div class="img-nick">
                        <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                            <img
                                src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                class="rounded-circle" alt="Circle Image"
                            >
                        </button>
                        <p class="text-light mt-2 fw-bold">${user.username}</p>
                    </div>
                    <div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                        <button class="btn btn-outline-danger"
                            data-action="remove"
                            data-username="${user.username}">
                            Cancel Invitation
                        </button>
                    </div>
                </div>
                `;
            }
            else if (filterType === 'incoming_requests') {
                userHtml = `
                <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                    <div class="img-nick">
                        <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                            <img
                                src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}"
                                class="rounded-circle" alt="Circle Image"
                            >
                        </button>
                        <p class="text-light mt-2 fw-bold">${user.username}</p>
                    </div>
                    <div class="custon-btn-group d-flex justify-content-center align-items-center flex-wrap gap-1">
                        <button class="btn btn-outline-success"
                            data-action="accept"
                            data-username="${user.username}">
                            Accept
                        </button>
                        <button class="btn btn-outline-danger"
                            data-action="remove"
                            data-username="${user.username}">
                            Cancel
                        </button>
                    </div>
                </div>
                `;
            }
            else {
                userHtml = `
                <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4">
                    <div class="img-nick">
                        <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                            <img src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}" class="rounded-circle" alt="Circle Image">
                        </button>
                        <p class="text-light mt-2 fw-bold">${user.username}</p>
                    </div>
                    Something Went Wrong...
                </div>
                `;
            }

            const template = document.createElement('template');
            template.innerHTML = userHtml.trim();

            return template.content.firstChild;
        } catch (error) {
            console.error('Error creating user element:', error);
            return null;
        }
    }

}
