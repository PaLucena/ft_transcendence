function applyChat() {
	fetch('components/chat/chat.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('chat-placeholder').innerHTML = data;
		})
		.catch(error => console.error('Error loading chat:', error));
}

function	openClosePopUp() {
	if (document.getElementById("popUp").style.display === "block")
		document.getElementById("popUp").style.display = "none";
	else
		document.getElementById("popUp").style.display = "block";
}
