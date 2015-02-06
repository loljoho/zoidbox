'use strict';

module.exports = (function(){

	var pattern = /\b(\d+)(f|c)\b/i;

	return function init( bot ){
		bot.on( 'message', function( from, to, text ){

			if (bot.isChannelPaused(to)) return;

			if (to === bot.botName) {
				 //they are talking to us in a private message, set to to be from
				 to = from;
			}

			var matches = text.match(pattern);
			if (matches !== null) {
				var currentUnit = matches[2];
				var currentVal = matches[1];
				if (currentUnit.toLowerCase() === 'f'){
					bot.say(to, 'BTW, ' + matches[1] + 'ºF is ~' + f2c( currentVal ) + 'ºC');
				}else{
					bot.say(to, 'BTW, ' + matches[1] + 'ºC is ~' + c2f( currentVal ) + 'ºF');
				}
			}
		});
	};

	function c2f( c ){
		return Math.round( c * 9 / 5 + 32 );
	}

	function f2c( f ){
		return Math.round( (f - 32) * 5 / 9 );
	}

})();