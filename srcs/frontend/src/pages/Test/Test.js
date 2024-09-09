import { Component } from "../../scripts/Component.js";
import customAlert from "../../scripts/utils/customAlert.js";

export class Test extends Component {
	constructor() {
		console.log('Test Constructor');
		super('/pages/Test/test.html');
	}

	init() {
		const alertPrimary = document.getElementById('custom_alert_primary');
		this.addEventListener(alertPrimary, 'click', () => {
			customAlert('primary', 'Hey its primary alert!!', '');
		});

		const alertSuccess = document.getElementById('custom_alert_success');
		this.addEventListener(alertSuccess, 'click', () => {
			customAlert('success', 'Hey its success alert!!', 2200);
		});

		const alertDanger = document.getElementById('custom_alert_danger');
		this.addEventListener(alertDanger, 'click', () => {
			customAlert('danger', 'Hey its danger alert!!', 2400);
		});

		const alertWarning = document.getElementById('custom_alert_warning');
		this.addEventListener(alertWarning, 'click', () => {
			customAlert('warning', 'Hey its warning alert!!', 2600);
		});

		const alertInfo = document.getElementById('custom_alert_info');
		this.addEventListener(alertInfo, 'click', () => {
			customAlert('info', 'Hey its info alert!!', 2800);
		});

	}
}
