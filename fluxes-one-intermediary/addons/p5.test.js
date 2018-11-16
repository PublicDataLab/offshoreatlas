p5.prototype.getMyBeautifulData = function(callback) {
	const result = {
		text: 'nope'
	};

	setTimeout(function() {

		result.text = 'got it';
		console.log('done', result);

		this._decrementPreload()

		if (typeof callback === 'function') {
			callback(result)
		}

	}, 2000); // simulate a slow load


	return result;
}

p5.prototype.registerPreloadMethod('getMyBeautifulData', p5.prototype);
