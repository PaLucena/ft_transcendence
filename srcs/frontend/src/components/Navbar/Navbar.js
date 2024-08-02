import { Component } from '../Component.js';

export class Navbar extends Component {
	constructor() {
		super("/components/Navbar/navbar.html")
	}

	async render() {
		return await super.render();
	}

	init() {
		// Navbar init logic
	}
}
