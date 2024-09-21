import { Component } from "../../scripts/Component.js";

export class languageSelector extends Component {
	constructor() {
		console.log('LanguageSelector Constructor');
		super('/components/LanguageSelector/languageSelector.html')
	}

	init() {
		languageSelector.updateLanguage()
	}

	static async updateLanguage() {
		const response = await fetch('/api/get_user_language', {
			method: 'GET',
			credentials: 'include'
		})

		const data = await response.json();

		console.log(data.language.toLowerCase());

		document.documentElement.lang = data.language.toLowerCase();
		const langData = await this.fetchLanguageData(data.language.toLowerCase())
		this.updateContent(langData);
	}

	static async fetchLanguageData(lang) {
		const response = await fetch(`../../assets/languages/${lang}.json`);
		return await response.json();
	}

	static updateContent(langData) {
		console.log(`Response:`, langData);
		document.querySelectorAll('[data-i18n]').forEach(element => {
			const key = element.getAttribute('data-i18n');
			element.innerHTML = langData[key];
			console.log("Cambiando:", element.id, element.innerHTML);
		});
	}
}
