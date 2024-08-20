import { Component } from "../../scripts/Component.js";

export class Navbar extends Component {
	constructor() {
		super('/components/Navbar/navbar.html')
	}

	init() {
		this.initNavbar();
	}

	initNavbar() {} // TODO: la foto de usuario
}
