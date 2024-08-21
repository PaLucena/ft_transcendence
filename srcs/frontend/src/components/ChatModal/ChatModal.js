import {Component} from '../../scripts/Component.js'
import { ChatLoader } from './ChatLoader.js';
import { ChatRenderer } from './ChatRenderer.js';
import { WebSocketHandler } from './WebSocketHandler.js';
import { UISetup } from './UISetup.js';
import { eventEmitter } from '../../scripts/utils/EventEmitter.js';

export class ChatModal extends Component {
    constructor() {
        console.log('ChatModal Constructor');
        super('/components/ChatModal/chatmodal.html');
        this.chatSocket = null;
        this.messageInputHandler = null;

        this.chatRenderer = new ChatRenderer(this, eventEmitter);
        this.chatLoader = new ChatLoader(this);
        this.webSocketHandler = new WebSocketHandler(this);
        this.uiSetup = new UISetup(this);
    }

    destroy() {
        console.log('Chat Custom destroy');

        this.webSocketHandler.closeWebSocket();
        this.removeAllEventListeners();
        this.uiSetup.removeMessageFormEvents();
    }

    async init() {
        this.uiSetup.setupMessagesModal();
        this.uiSetup.setupChatModal();
        this.uiSetup.setupCloseMessagesModal();
        this.uiSetup.setupScrollEvent();
        this.uiSetup.setupMessageInputEvent();
    }
}
