import { Component } from "../../scripts/Component.js";

class Home extends Component {
	constructor() {
		console.log('Home Constructor');
		super();
	}
}

let homeInstance = null;

export function getHomeInstance(params) {
	if (!homeInstance) {
		homeInstance = new Home(params);
	}
	return homeInstance;
}

