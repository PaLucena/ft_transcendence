import { Component } from "../../scripts/Component.js";
import customAlert from "../../scripts/utils/customAlert.js";
import { userSocket } from "../../scripts/utils/UserWebsocket.js";

export class Test extends Component {
	constructor() {
		super('/pages/Test/test.html');
	}

	init() {
		const alertPrimary = document.getElementById('custom_alert_primary');
		this.addEventListener(alertPrimary, 'click', () => {
			customAlert('primary', 'Hey its primary alert!!', '');
		});

		const alertSuccess = document.getElementById('custom_alert_success');
		this.addEventListener(alertSuccess, 'click', () => {
			customAlert('success', 'Hey its success alert!!', 4200);
		});

		const alertDanger = document.getElementById('custom_alert_danger');
		this.addEventListener(alertDanger, 'click', () => {
			customAlert('danger', 'Hey its danger alert!!', 9400);
		});

		const alertWarning = document.getElementById('custom_alert_warning');
		this.addEventListener(alertWarning, 'click', () => {
			customAlert('warning', 'Hey its warning alert!!', 1600);
		});

		const alertInfo = document.getElementById('custom_alert_info');
		this.addEventListener(alertInfo, 'click', () => {
			customAlert('info', 'Hey its info alert!!', 7000);
		});

		const notiInvite = document.getElementById('notification_friend_invite');
		this.addEventListener(notiInvite, 'click', async () => {
			try {
				const message = JSON.stringify({
					action: 'notification',
					notification_type: 'invite',
					to_user: 'admin'
				});
				userSocket.socket.send(message);
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});

		const notiAccept = document.getElementById('notification_friend_accept');
		this.addEventListener(notiAccept, 'click', async () => {
			try {
				const message = JSON.stringify({
					action: 'notification',
					notification_type: 'accept',
					to_user: 'admin'
				});
				userSocket.socket.send(message);
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});

		const notiCancel = document.getElementById('notification_friend_cancel');
		this.addEventListener(notiCancel, 'click', async () => {
			try {
				const message = JSON.stringify({
					action: 'notification',
					notification_type: 'cancel',
					to_user: 'admin'
				});
				userSocket.socket.send(message);
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});
	}
}
