import { Component } from "../../scripts/Component.js";

export class languageSelector extends Component {
	constructor() {
		super('/components/LanguageSelector/languageSelector.html')
	}

	init() {
		languageSelector.currentLanguage = "en";
		languageSelector.updateLanguage();
		languageSelector.checkLanguage();
	}

	static async updateLanguage() {
		try {
			const response = await fetch('/api/get_user_language', {
				method: 'GET',
				credentials: 'include'
			})
			const data = await response.json();

			this.currentLanguage = data.language.toLowerCase();
			languageSelector.checkLanguage();
		}
		catch(error) {
			console.log("Error(updateLanguage):", error.message);
		}
	}

	static async checkLanguage() {
		document.documentElement.lang = this.currentLanguage;
		const langData = await this.fetchLanguageData(this.currentLanguage)
		this.updateContent(langData);
	}

	static async fetchLanguageData(lang) {
		const response = await fetch(`../../assets/languages/${lang}.json`);
		return await response.json();
	}

	static updateContent(langData) {
		document.querySelectorAll('[data-i18n]').forEach(element => {
			const key = element.getAttribute('data-i18n');
			element.textContent = langData[key];
		});
	}
}
