import { Component } from "../../scripts/Component.js";
import { WebSocketHandler } from "./WebSocketHandler.js";
import { UISetup } from "./UISetup.js";
import { InviteRenderer } from "./InviteRenderer.js";

export class InviteModal extends Component {
	constructor() {
        console.log('InviteModal Constructor');
        super('/components/InviteModal/invitemodal.html');

		this.inviteRenderer = new InviteRenderer(this);
        this.webSocketHandler = new WebSocketHandler(this);
        this.uiSetup = new UISetup(this);
    }

    destroy() {
        console.log('Invite Custom destroy');
        this.removeAllEventListeners();
    }

    async init() {
        
    }
}
