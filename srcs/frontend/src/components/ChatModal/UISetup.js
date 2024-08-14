export class UISetup {
    constructor(chatModal) {
        this.chatModal = chatModal;
    }

    setupChatModal() {
        $('#chats_modal').on('shown.bs.modal', () => {
            this.chatModal.chatLoader.loadChats();
        });
    }

    setupMessagesModal() {
        $('#messages_modal').on('shown.bs.modal', () => {
            document.activeElement.blur();
            const messageInput = $('#chat_message_input')
            if (messageInput) {
                messageInput.focus()
            }
        });
    }

    setupCloseMessagesModal() {
        $('#messages_modal').on('hidden.bs.modal', () => {
            this.chatModal.webSocketHandler.closeWebSocket();
            $("#chat_messages").empty();
        });
    }

    setupScrollEvent() {
        $('#chat_messages_container').on('scroll', () => {
            const expandedButton = $('button[aria-expanded="true"]');
            if (expandedButton.length) {
                expandedButton.click();
            }
        });
    }

    setupAnimation() {
        const triggerAnimation = () => {
            $('.bounce-animation').each(function() {
                const $element = $(this);
                $element.removeClass('bounce');
                setTimeout(() => $element.addClass('bounce'), 0);
            });
        };

        setInterval(triggerAnimation, 3000);
        triggerAnimation();
    }

    setupChatRender() {
        $(document).on('click', '.open_chat_btn', (event) => {
            const targetElement = $(event.target).closest('.open_chat_btn');
            const chatroomName = targetElement.data('chatroom_name');
            this.chatModal.chatLoader.initChatroom(chatroomName);
        });
    }
}
