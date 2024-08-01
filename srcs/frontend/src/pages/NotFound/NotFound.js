import { Page } from "../Page.js";

export class NotFound extends Page {
	constructor() {
		super("/pages/NotFound/404.html");
	}

	render() {
		return super.render()
	}

	init() {
		// Function for Init NotFound
	}
}
