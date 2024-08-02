import { Page } from '../Page.js';

export class Home extends Page {
	constructor() {
		super("../../src/pages/Home/home.html");
	}


	async render() {
		return `<h1>heelllo</h1>`
	}

	init() {
		console.log("Home page initialized.");
	}
}
