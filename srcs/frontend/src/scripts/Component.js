export class Component {
	constructor(rout, params = {}) {
		this.rout = rout;
		this.params = params;
        this.eventListeners = [];
	};

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

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

	static async renderComponent(instance, placeholderId) {
        try {
            const componentHtml = await instance.render();
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = componentHtml;
                if (typeof instance.init === 'function') {
                    await instance.init();
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

    destroy() {
        console.log(`Destroying ${this.constructor.name}`);
        this.removeAllEventListeners();
    }
  }

