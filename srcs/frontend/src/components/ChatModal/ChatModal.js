import { Component } from "../../scripts/Component.js";

export class ChatModal extends Component {

	constructor() {
		super('/components/ChatModal/chatmodal.html')
	}

	init() {
		this.initChatModal();
	}

	initChatModal() {
		$('.modal').on('shown.bs.modal', function() {
			$(this).find('[autofocus]').focus();
		});

		$('#chat_container').on('scroll', function() {
			const expandedButton = $('button[aria-expanded="true"]');

			if (expandedButton.length) {
				expandedButton.click();
			}
		});

		function triggerAnimation() {
			$('.bounce-animation').each(function() {
				var $element = $(this);
				$element.removeClass('bounce');
				setTimeout(function() {
					$element.addClass('bounce');
				}, 0);
			});
		}

		setInterval(triggerAnimation, 3000);
		triggerAnimation();
	}
}
