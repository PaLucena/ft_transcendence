document.addEventListener('DOMContentLoaded', function() {
    const clickmeBtn = document.getElementById('clickme-btn');
    const resetBtn = document.getElementById('reset-btn');
    const contadorElemento = document.getElementById('contador');

    function obtainClicks(met, param) {
        return function() {
            let bodyData = {};
            if (param) {
                bodyData.action = param;
            }
			if (met == 'GET') {
				request = {
					method: met,
					headers: {
						'Content-Type': 'application/json'
					}
				};
			}
			else if (met == 'POST') {
				request = {
					method: met,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(bodyData)
				};
			}
			else {
				request = {};
			}
            fetch('/api/click/', request)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Hubo un problema al realizar la solicitud: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                contadorElemento.textContent = data.count;
            })
            .catch(error => {
                console.error('Error al realizar la solicitud:', error);
            });
        };
    }

    obtainClicks('GET', '')(); // Realizar la primera solicitud al cargar la página
    
	clickmeBtn.addEventListener('click', obtainClicks('POST', 'increm'));
    resetBtn.addEventListener('click', obtainClicks('POST', 'reset'));
});