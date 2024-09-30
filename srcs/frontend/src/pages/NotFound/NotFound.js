import { Component } from "../../scripts/Component.js";

export class NotFound extends Component {
	constructor() {
		super('/pages/NotFound/404.html');
	}

	init() {
		this.goBack();
	}

	goBack() {
		const goBack = document.getElementById("goBackBtn");
		this.addEventListener(goBack, 'click', () => {
			window.history.back();
		});
	}
}
