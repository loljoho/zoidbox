'use strict';

module.exports = (function(){

	var _ = require( 'lodash' );
	var request = require( 'request' );
	var charmed = require( 'charmed' );
	var feedparser = require('ortoo-feedparser');
	var bot;
	var frequency = 1000 * 60 * 15; //every 15 minutes
	var feedUrl = 'http://feeds.feedburner.com/CfhourColdfusionPodcast';

	return function init( _bot ){
		bot = _bot;

		bot.on( 'message', function( from, to, text, message){

			if (bot.isChannelPaused(to)) return;

			if (to === bot.botName) {
			    //they are talking to us in a private message, set to to be from
			    to = from;
			}

			if ( text === '#cfhour !poll' ){
				checkForShows();
			}else if ( text === '#cfhour !init' ){
				bot.ops.isOp( message.user, function( err, data ){
					if ( err ){
						return bot.say( to, 'Error determinging your OPS status. Oops.');
					}
					if ( data === 0 ){
						return bot.say( to, 'You must be an op to do that, ' + from );
					}
					checkForShows( true );
					bot.say( to, 'Good to go, ' + from );
				});
			} else if ( text === '#cfhour !latest' ){
				fetchLatestWaffle();
			}
		});

		setInterval( checkForShows, frequency );
	};

	function fetchLatestWaffle(){

		console.log('Checking for the latest CFHour show...' );

		feedparser.parseUrl(feedUrl, {addmeta: false},
			function callback (error, meta, articles){
				if (!error) {
					var selectedShow = articles[0];
					bot.say( '#zoidbox', 'Waffle alert! Latest CFHour Show: ' + selectedShow.title + ' ~ ' + selectedShow.enclosures[0].url + ' ~ http://cfhour.com' );
					bot.say( '##coldfusion', 'Waffle alert! Latest CFHour Show: ' + selectedShow.title + ' ~ ' + selectedShow.enclosures[0].url + ' ~ http://cfhour.com' );
				} else {
					console.error(error);
				}
			}
		);

	}

	function checkForShows( quietly ){
		quietly = quietly || false;

		console.log('Checking for latest CFHour shows...' );

		feedparser.parseUrl(feedUrl, {addmeta: false},

			function callback (error, meta, articles){
				if (!error) {
					try {

						console.log('Feed info');
						console.log('%s - %s - %s', meta.title, meta.link, meta.xmlurl);

						var errors = 0;
						articles.forEach(function (article){
							console.log('%s - %s (Posted %s)', article.title, article.enclosures[0].url, article.date);
							var showRef = article.title.split('-')[0];
							showRef = showRef.substr(0, showRef.length -1);
							try {
								notify( showRef, article.title, article.enclosures[0].url, quietly );
							}catch(e){
								errors++;
							}
						});

						if (errors > 0){
							bot.say( '#zoidbox', 'CFHour Plugin Error, please check the bot logs for details...');
						}

					} catch (e) {
						console.error( 'Error parsing podcast feed response :(' );
						bot.say( '#zoidbox', 'There was a problem parsing the CFHour podcast feed response :( ~ ' + feedUrl );
					}
				}
				else {
					console.error(error);
				}
			}

		);
	}

	function notify( showRef, title, link, quietly ){
		quietly = quietly || false;
		bot.redis.sismember( 'cfhour.seen', showRef, function( err, data ){
			if ( err ){
				console.error( err );
				throw new Error('Error in CFHour plugin, see bot logs for more details.');
			}
			if ( data === 0 ){ //haven't posted about this one yet, share it
				if ( !quietly ){
					bot.say( '#zoidbox', 'Waffle alert! NEW CFHour Show: ' + title + ' ~ ' + link + ' ~ http://cfhour.com' );
					bot.say( '##coldfusion', 'Waffle alert! NEW CFHour Show: ' + title + ' ~ ' + link + ' ~ http://cfhour.com' );
				}
				bot.redis.sadd( 'cfhour.seen', showRef );
			}else{
				//skip notification, we've already posted about this one
				console.log( 'skipping %s, shared it already', showRef );
			}
		});
	}

}());
