import {Component} from '../../scripts/Component.js'
import { ChatLoader } from './ChatLoader.js';
import { ChatRenderer } from './ChatRenderer.js';
import { WebSocketHandler } from './WebSocketHandler.js';
import { UISetup } from './UISetup.js';

export class ChatModal extends Component {
    constructor() {
        super('/components/ChatModal/chatmodal.html');
        this.chatRenderer = new ChatRenderer(this);
        this.chatLoader = new ChatLoader(this);
        this.webSocketHandler = new WebSocketHandler(this);
        this.uiSetup = new UISetup(this);
    }

    init() {
        this.uiSetup.setupChatModal();
        this.uiSetup.setupMessagesModal();
        this.uiSetup.setupCloseMessagesModal();
        this.uiSetup.setupScrollEvent();
        this.uiSetup.setupAnimation();
        this.uiSetup.setupChatRender();
    }
}
