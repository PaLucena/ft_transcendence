import { Page } from './Page.js';

export class Chat extends Page {
    constructor(params = {}) {
        super("/pages/chat.html", params);
    }

	async render() {
		const html = await super.render();
		return html;
	}

	init() {
		initChat(this.params.chatId);
	}
}
