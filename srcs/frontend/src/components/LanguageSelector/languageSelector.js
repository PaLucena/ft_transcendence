import { Component } from "../../scripts/Component.js";

export class LanguageSelector extends Component {
	constructor() {
		console.log('LanguageSelector Constructor');
		super('/components/LanguageSelector/languageSelector.html')
		this.language = "EN";
	}

	init() {
		this.selectLanguage();
	}

	selectLanguage() {
		const languageBtn = document.getElementById('languageBtn');

		this.addEventListener(languageBtn, 'click', () => {
			switch(languageBtn.innerHTML) {
				case 'EN':
					languageBtn.innerHTML = 'ES';
					break ;
				case 'ES':
					languageBtn.innerHTML = 'FR';
					break ;
				case 'FR':
					languageBtn.innerHTML = 'EN';
					break ;
				default:
					break ;
			}
		});
	}

	static languageSelected() {
		return (this.language);
	}
}
