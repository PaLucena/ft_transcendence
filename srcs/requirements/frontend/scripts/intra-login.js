function	intraLogin() {
	fetch('https://api.intra.42.fr/v2/oauth/authorize', {
		method: 'GET',
		mode: 'no-cors',
		headers: {
			'client_id': "u-s4t2ud-781a91f2e625f3dc4397483cfabd527da78d78a6d43f5be15bfac2ea1d8fe8c6",
			'redirect_uri': ''
		}
	})
}
