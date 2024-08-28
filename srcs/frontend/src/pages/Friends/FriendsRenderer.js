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

            if (filterType === 'my_friends') {
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
                    <button class="btn btn-outline-light"
                            data-action="${user.is_friend ? 'remove' : 'add'}"
                            data-username="${user.username}">
                        Remove
                    </button>
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
