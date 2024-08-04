export class Component {
	constructor(rout, params = {}) {
		this.rout = rout;
		this.params = params;
	};

	async render() {
		const html = await this.fetchHtmlFromFile(this.rout);
		return html;
	}

	async fetchHtmlFromFile(route) {
		if (route) {
			try {
				const response = await fetch(route);
				if (response.ok) return await response.text();
				else {
					console.error(`Failed to load Page at ${route}: ${response.status}`);
					return `<div>Error loading Page.</div>`;
				}
			} catch (error) {
				console.error(`Error fetching Page at ${route}:`, error);
				return `<div>Error loading Page.</div>`;
			}
		}
		return `<div>Page route not defined.</div>`;
	}

	async renderComponent(ComponentClass, placeholderId) {
		try {
			const component = new ComponentClass();
			const componentHtml = await component.render();
			const placeholder = document.getElementById(placeholderId);
			if (placeholder) {
				placeholder.innerHTML = componentHtml;
				if (typeof component.init === 'function') {
					await component.init();
				}
			} else {
				console.warn(`Placeholder with id "${placeholderId}" not found.`);
			}
		} catch (error) {
			console.error("Error rendering component:", error);
		}
	}

	async init() {

	}
  }

