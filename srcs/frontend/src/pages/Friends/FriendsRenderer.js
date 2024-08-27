export class FriendsRenderer {
    constructor(friends) {
        this.friends = friends;
    }

    renderUsersElements(users) {
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
            const userHtml = `
            <div class="chat-element scale-fade-in-up col-6 col-sm-4 col-md-4 col-lg-2 mb-4 data-username="${user.username}">
                <div class="img-nick">
                    <button class="btn rounded-circle bg-dark d-flex justify-content-center align-items-center position-relative">
                        <img src="${user.other_user_avatar_url || '/assets/images/default_avatar.jpg'}" class="rounded-circle" alt="Circle Image">
                    </button>
                    <p class="text-light mt-2 fw-bold">${user.username}</p>
                </div>
                <button class="btn ${user.is_friend ? 'btn-outline-light' : 'btn-light'}">
                    ${user.is_friend ? 'Remove' : 'Add'}
                </button>
            </div>
            `;

            const template = document.createElement('template');
            template.innerHTML = userHtml.trim();

            return template.content.firstChild;
        } catch (error) {
            console.error('Error creating user element:', error);
            return null;
        }
    }

}
