import { Component } from '../Component.js';

export class ChatBtn extends Component {
	constructor() {
		super("/components/ChatBtn/chatbtn.html")
	}

	async render() {
		return await super.render();
	}

	init() {
		this.openClosePopUp();
	}

	openClosePopUp() {
		let popupBtn = document.getElementById("chatBtn");
		
		popupBtn.addEventListener("click", () => {
			console.log("hola");
			if (document.getElementById("popUp").style.display === "block")
				document.getElementById("popUp").style.display = "none";
			else
			document.getElementById("popUp").style.display = "block";
		});
	}
}
