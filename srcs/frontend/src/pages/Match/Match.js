import { Component } from '../../scripts/Component.js';
import { navigateTo } from '../../scripts/Router.js';
import { languageSelector } from '../../components/LanguageSelector/languageSelector.js';
import customAlert from '../../scripts/utils/customAlert.js';

export class Match extends Component {
	constructor() {
		console.log('Match Constructor');
		super('/pages/Match/match.html');
	}

	destroy() {
		console.log("Match Custom destroy");
		this.removeAllEventListeners();
		setTimeout(() => languageSelector.updateLanguage(), 0);
    }

	init() {
		this.displayInfo();
	}

	displayInfo() {
		const	players = document.querySelectorAll('[id^="match-player"]');
		
		players.forEach(player => {
			player.querySelector('[id^="match-nickname-"]').innerHTML =  player.id.slice(6);
			player.querySelector('[id^="match-avatar-"]').src = '../../assets/images/default_avatar.jpg';
		});
	}
}
