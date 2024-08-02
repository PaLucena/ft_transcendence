export class Component {
	constructor(route = '') {
		this.route = route;
	}

	async render() {
		if (this.route) {
			try {
				const response = await fetch(this.route);
				if (response.ok)
					return await response.text();
				else {
					console.error(`Failed to load component at ${this.route}: ${response.status}`);
					return `<div>Error loading component.</div>`;
				}
			}
			catch (error) {
				console.error(`Error fetching component at ${this.route}:`, error);
				return `<div>Error loading component.</div>`;
			}
		}
		return `<div>Component route not defined.</div>`;
	}

	init() {
		// General component logic for init
	}
}
