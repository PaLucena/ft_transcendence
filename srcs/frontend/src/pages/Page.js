export class Page {
	constructor(route, params = {}) {
	  this.route = route;
	  this.params = params;
	}

	async render() {
		if (this.route) {
		  try {
			const response = await fetch(this.route);
			if (response.ok) {
			  return await response.text();
			} else {
			  console.error(`Failed to load Page at ${this.route}: ${response.status}`);
			  return `<div>Error loading Page.</div>`;
			}
		  } catch (error) {
			console.error(`Error fetching Page at ${this.route}:`, error);
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
			} else {
				console.warn(`Placeholder with id "${placeholderId}" not found.`);
			}
		} catch (error) {
			console.error("Error rendering component:", error);
		}
	}

	init() {
	  // Function for init  URL
	}
  }
