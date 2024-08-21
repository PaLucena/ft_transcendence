import { Component } from "../../scripts/Component.js";

export class Navbar extends Component {
	constructor() {
		console.log('NavBar Constructor');
		super('/components/Navbar/navbar.html')
	}
}
