import { Component } from "../../scripts/Component.js";
import customAlert from "../../scripts/utils/customAlert.js";
import { userSocket } from "../../scripts/utils/UserWebsocket.js";

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
					type: 'friend_invite',
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
					type: 'friend_accept',
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
					type: 'friend_cancel',
					to_user: 'admin'
				});
				userSocket.socket.send(message);
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});

		const connect1x1 = document.getElementById('connect_1x1');
		this.addEventListener(connect1x1, 'click', async () => {
			try {
				userSocket.socket.send(JSON.stringify({
					action: 'invitation_1x1',
					type: 'connect',
					group_name: 'invite_1x1_Bart_to_admin'
				}));
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});

		const accept1x1 = document.getElementById('accept_1x1');
		this.addEventListener(accept1x1, 'click', async () => {
			try {
				const message = JSON.stringify({
					action: 'invitation_1x1',
					type: 'accept',
					group_name: 'invite_1x1_Bart_to_admin'
				});
				userSocket.socket.send(message);
			} catch (error) {
				console.error('Failed to send notification:', error);
			}
		});
	}
}
