import { Component } from "../../scripts/Component.js";

class NotFound extends Component {
	constructor() {
		console.log('NotFound Constructor');
		super('/pages/NotFound/404.html');
	}

	init() {
		this.goBack();
	}

	goBack() {
		const	goBack = document.getElementById("goBackBtn");
		goBack.addEventListener("click", () => {
			window.history.back();
		});
	}
}

let notFoundInstance = null;

export function getNotFoundInstance(params) {
	if (!notFoundInstance) {
		notFoundInstance = new NotFound(params);
	}
	return notFoundInstance;
}
