export class Page {
	constructor(route, params = {}) {
	  this.route = route;
	  this.params = params;
	}

	async render() {
	  try {
		const html = await fetch(this.route).then(data => data.text());
		return html;
	  } catch (error) {
		console.error("Error on loading page", error);
		return "<h2>Error on loading page</h2>";
	  }
	}

	init() {
	  // Function for init every URL
	}
  }
