/*

	JazzBot 5200, a bot for Turntable.fm's Future Jazz Pad
	by Alex Mizell
	March 16th, 2012
	
	Turntable.fm
		http://turntable.fm
		http://turntable.fm/future_jazz_pad_a_mizell
	
	Written with Alain Gilbert's TTAPI for node.js
		http://alaingilbert.github.com/Turntable-API/
	
	Node.js
		http://nodejs.org/

	lastfm-node
		https://github.com/jammus/lastfm-node
	
*/

// required node.js libraries
var Bot = require('ttapi'); // Turntable.fm
var LastFmNode = require('lastfm').LastFmNode; // LastFM API

// these are identified on Turntable using Alain's bookmarklet: http://alaingilbert.github.com/Turntable-API/bookmarklet.html
var TTAUTHID = 'auth+live+xxxxxxxxxxxxxxxxxxxxxxxxxx';
var TTUSERID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx';
var TTROOMID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx';

// score these from here:  http://www.last.fm/api/account
var LASTFM_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; 
var LASTFM_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// bot globals
var lastSeen = {};
var djs      = [];
var botRepeatMe = false;
var discoMode = false;
var currentAvatar = 1; // asian girl
var lastUserToEnter;
var learnMode = false;
var greetMode = true;
var randomMode = false;
var permitted = false;
var imOnDeck = false;

var myPlaylist = [];
var songCount = 90;
var currentSong;
var currentDJ;
var currentDJID;
var currentArtist;

// init the mongodb connection for bot's persistent memory - requires mongodb be running local
var db = require('mongojs').connect('127.0.0.1:27017/jazzbot5200', ['fjpHistory','fjpVotes']);


// init the Turntable bot!  he's aliiiiiiive!
var bot = new Bot(TTAUTHID, TTUSERID, TTROOMID);

// init Last.fm API
var lastfm = new LastFmNode({

	api_key: LASTFM_KEY,
	secret: LASTFM_SECRET,
	//useragent: APP_STRING
	
});

//  uncomment this to see the matrix
//bot.debug = true;

// event handlers!  yay!

// keep the local dj list current
bot.on('roomChanged', function (data) {

   djs = data.room.metadata.djs;
   
   //  check for 0 or 1 DJs, get up if needed
   
   // if someone was booted ask if mod wants to add them to ban list
   
});

bot.on('add_dj', function (data) {

   djs.push(data.user[0].speakerid);
   
});

bot.on('rem_dj', function (data) {

   djs.splice(djs.indexOf(data.user[0].speakerid), 1);
   
});

bot.on('speak', function (data) {

	var speaker = data.name;
	var text = data.text.toLowerCase();
	var speakerid = data.userid;
	
	// security check
	if (speakerid == 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx' || speakerid == 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx' || speakerid == 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx') { //  alex or sb or nop's user ID
		
		permitted = true;
		//bot.speak('permission granted');
	
	}
	
	//blanket prohibition against bot responding to its own words
	if(speakerid != TTUSERID) {
   
		// Respond to greetings
		if (((text.indexOf('hello') != -1 || text.indexOf('sup') != -1 || text.indexOf('herro') != -1 || text.indexOf('what up') != -1 || text.indexOf('greetings') != -1 || text.indexOf('hey') != -1 || text.indexOf('hi ') != -1) && text.indexOf('jazzbot') != -1 ) || text.match(/^\/hello$/)) {
	   
			bot.speak('sup '+data.name+'.');
		
		}

		// Respond to dance command
		if (((text.indexOf('dance') != -1 || text.indexOf('bop') != -1 || text.indexOf('boogie') != -1 || text.indexOf('funky') != -1 || text.indexOf('krunk') != -1 ) && text.indexOf('jazzbot') != -1) ||text.match(/^\/dance$/)) {
	   
			bot.bop()
		
		}
	   
		// Respond to sexytime propositions
		if ((text.indexOf('sex') != -1 || text.indexOf('penis') != -1 || text.indexOf('vagina') != -1 || text.indexOf('pussy') != -1 || text.indexOf('cunt') != -1 || text.indexOf('cock') != -1) && data.name != 'JazzBot 5200' ) {
	   
			var rnd = Math.floor(Math.random()* 8);
	   
			switch (rnd) {
			
			case 0:
			case 1:
			case 2:
			
				//do nothing
				break;
		
			case 3:
			case 4:
			case 5:
			
				bot.speak('/me giggles');
				break;
			
			case 6:
				
				bot.speak(':sweat::eggplant:');
				break;
				
			case 7:
			
				bot.speak(':point_right::ok_hand:');
				break;
				
			}
		}
	   
		// Respond to cake
		if (text.indexOf('cake') != -1 || text.match(/^\/cake$/)) {
			
			if (data.name == 'Alex Mizell' || data.name == '.:star:burst Chris'){
			
				bot.speak('/me gives :cake: to '+data.name+'.');
			
			} else {
			
				bot.speak('the :cake: is a lie, '+data.name+'.');
			
			}
		}
	 
		// Respond to beer requests
		if ((text.indexOf('beer') != -1 && text.indexOf('jazzbot') != -1) || (text.match(/^\/beer$/))) {
			
			if (text.indexOf('beers') != -1 && data.text.indexOf('jazzbot') != -1 ){
			
				if (text.indexOf('to') != -1 && text.indexOf('give') != -1 ) {

					bot.speak('/me gives :beers: to ' + whoTo(text) + '.');
					
				} else {
				
					bot.speak('here ya go, '+data.name+'.  :beers:');	
				
				}
				
			} else {
			
				if (text.indexOf('to') != -1 && text.indexOf('give') != -1) {				
					
					bot.speak('/me gives ' + whoTo(text) + ' a :beer:');
					
				} else {
				
					bot.speak('here ya go, ' + data.name + '.  :beer:');	
				
				}
				
			}
		
		}

		//  respond to requests for room info or theme
		if ((((text.indexOf('theme') != -1 ) || (text.indexOf('room info') != -1 )) && text.indexOf('jazzbot') != -1 ) || text.match(/^\/theme$/) || text.match(/^\/info$/)) {
		
			bot.speak('The Future Jazz Pad at Turntable.fm exists to provide a venue for \"sexy, soulful, sophisticated jazz from any era, with an emphasis on nu jazz and jazzy drum and bass music.\"\n\nFor more info read up\:\n\nhttp\:\/\/en.wikipedia.org\/wiki\/Nu\_jazz\nhttp\:\/\/en.wikipedia.org\/wiki\/Drum\_and\_bass\n');
		
		}
		
		// respond to genre inquiry
		if ( (text.indexOf("what genre") != -1 && text.indexOf("jazzbot") != -1) || text.match(/^\/genre$/) ) {
			
			console.log('\nSomeone asked me what the genre is\n\n', data);		

			// Get the current room info
			bot.roomInfo(true, function(data) {
				// Get the current song name
				var songName = data.room.metadata.current_song.metadata.song;
				var artist= data.room.metadata.current_song.metadata.artist;

				// Ask last.fm what the genre is
				var request = lastfm.request("track.getInfo", {
					track: songName,
					artist: artist,
					handlers: {
						success: function(data) {
							console.log("Success: " + data);
							bot.speak( 'Sounds like '+data.track.toptags.tag[0].name+' to me.' );
							//if(data.room.metadata.current_song.metadata.genre != ''){
							//	bot.speak('It\'s labelled '+ data.room.metadata.current_song.metadata.genre + '. ');
							//}
							
						},
						error: function(error) {
							
							if(data.room.metadata.current_song.metadata.genre != ''){
								bot.speak('Last.fm didn\'t know, but it\'s labelled '+ data.room.metadata.current_song.metadata.genre + '. ');
							}
							else{
								console.log("Error: " + error.message);
								bot.speak( "No idea, you hipster." );
							}
						}
					}
				}); 
			});
		}
		
		// Respond to get up
		if ( ((text.indexOf("get up") != -1 || text.indexOf("on deck") != -1) && data.text.indexOf("jazzbot") != -1) || (data.text.match(/^\/up$/))) {
				
			bot.speak('I will make you proud, '+data.name+'.');
			bot.addDj();
			imOnDeck = true;

		}
		
		// respond to album query
		if ( (text.indexOf("what album") != -1 && text.indexOf("jazzbot") != -1) || text.match(/^\/album$/)) {
			
			//console.log('\nSomeone asked me what the album is\n\n', data);		

			// Get the current room info
			bot.roomInfo(true, function(data) {
			
				if(data.room.metadata.current_song.metadata.album !=''){
					bot.speak('It\'s from \"'+ data.room.metadata.current_song.metadata.album + '\". ');
					}
				else{
					bot.speak('I dunno dude, doesn\'t say.');
				}
			
			});
		}
		
		// respond to request query
		if ( (text.indexOf("request") != -1 && text.indexOf("jazzbot") != -1) || text.match(/^\/request$/)) {
			
			// figure out what was requested
			
			// search playlist for it
			
			// move to top of queue if found
			
			// error if not

		}
		
		// userID restricted commands *********************************************************************************************************
		// commands below this point need to test for permitted to maintain security, but may also have an else clause for smartass comebacks
		
		/*// Respond to get up  [this code is no longer privileged]
		if ( ((text.indexOf("get up") != -1 || text.indexOf("on deck") != -1) && data.text.indexOf("jazzbot") != -1) || (data.text.match(/^\/up$/))) {
			
			if(permitted){
			
				bot.speak('I will make you proud, '+data.name+'.');
				bot.addDj();
				imOnDeck = true;
			
			}
			else{
			
				bot.speak('No.');
			
			}
		} */
		
		// Respond to get down
		if ((text.indexOf("get down") != -1 || text.indexOf("off deck") != -1 ) && data.text.indexOf("jazzbot") != -1 ||(data.text.match(/^\/down$/))) {
			
			if(permitted){
			
				bot.speak('Didn\'t you like my choons, '+data.name+'?');
				bot.remDj();
				imOnDeck = false;
			
			}
			else {
			
				bot.speak('Bite my shiny metal ass.');
			
			}
			
		}
		
		// Respond to snag comand
		if (text.indexOf("snag this") != -1 && text.indexOf("jazzbot") != -1 || text.match(/^\/snag$/) ) {
			
			if(permitted){
			
			yoink(data);
			
			}
			else{
			
			bot.speak('No.');
			
			}
			
		}
				
		// Respond to "/disco" command
		if ( (text.indexOf("boogie down") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/disco$/))) {
			
			
			if (permitted){
			
				switch(discoMode){
			
				case false:
				
					bot.speak('Disco mode:  ENGAGED!');
					discoMode = true;
					break;
					
				case true:
					
					bot.speak('You\'re no fun.');
					discoMode = false;
					bot.setAvatar(1);
				
				}
			
			}
			else{
			
			bot.speak('You\'re not the boss of me, ' + data.name + '.');
			
			}
			
		}
		
		// Respond to "/learn" command
		if ( (text.indexOf("learn") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/learn$/))) {
				
				if(permitted){
				
					switch(learnMode){
					
					case false:
					
						bot.speak('/me studies the DJs');
						learnMode = true;
						break;
						
					case true:
						
						bot.speak('I\'m getting dumber already.');
						learnMode = false;
					
					}
				
				}
				else{
				
				bot.speak('No.');
				
				}
				
			}

		// Respond to "/skip" command
		if ( (text.indexOf("skip") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/skip$/))) {
				
			if(permitted){
			
				bot.skip();
				
			}
			
			else{
			
			bot.speak('No.');
			
			}	
		}
		
		// Respond to "/playlist" command
		if ( (text.indexOf("playlist") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/playlist$/))) {
				
			if(permitted){
			
				printPlaylist();
				
			}

		}

		// Respond to "/greet" command
		if ( (text.indexOf("toggle greet") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/greet$/))) {
			
			
			if (permitted){
			
				switch(greetMode){
			
				case false:
				
					bot.speak('Greetings enabled.');
					greetMode = true;
					break;
					
				case true:
					
					bot.speak('No greetings.');
					greetMode = false;
				
				}
			
			}
			else{
			
			bot.speak('You\'re not the boss of me, ' + data.name + '.');
			
			}
		}
	
		// Respond to "/random" command
		if ( (text.indexOf("mix it up") != -1 && text.indexOf("jazzbot") != -1) || (text.match(/^\/random$/))) {
		
			if (permitted){
			
				switch(randomMode){
			
				case false:
				
					bot.speak('Mixing it up.');
					randomMode = true;
					break;
					
				case true:
					
					bot.speak('Playing straight through playlist.');
					randomMode = false;
				
				}
			
			}
			else{
			
			bot.speak('You\'re not the boss of me, ' + data.name + '.');
			
			}
		}

			
		// end restricted commands
		permitted = false;
	   
	    // update dj afk timer when someone speaks
	    justSaw(data.userid);
	   
    } 
});

bot.on('pmmed', function(data){

	// check for alex or sb's speakerid
	if(data.senderid == 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx' || data.senderid == 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'){
	
		permitted = true;	
	
	}
	
	if(permitted){
		
		if (data.text.indexOf("repeat after me") != -1 && data.text.indexOf("jazzbot") != -1 ||(data.text.match(/^\/speak$/))) {
			
			switch(botRepeatMe){
			
				case true:
			
				bot.pm('I will shut up now.', data.senderid);
				botRepeatMe = false;
				break;
			
				case false:
			
				bot.pm('Ok, I will repeat after you.', data.senderid);
				botRepeatMe = true;
				break;
				
				}
				
		}
			
		else{
		
			if(botRepeatMe){
				
				bot.speak(data.text);
			
			}
		}
	}
	else{
	
		bot.pm('You ain\'t the boss of me.', data.senderid);
	
	}
	
	// end of 
	permitted = false;
	
});

bot.on('registered', function (data) { 

	var speakerid = data.user[0].userid;
	var name = data.user[0].name;

	// greeter	
	if(speakerid != TTUSERID && speakerid != lastUserToEnter && greetMode){ // only greet once

		bot.speak('Yo sup ' + name + '.');
		lastUserToEnter = speakerid;
		
	}

	// check if bot registered itself, then run inits
	
	//  get playlist and songcount, etc
	
	
});

bot.on('endsong', function (data) { 

	// Get the current room info
	bot.roomInfo(true, function(data) {
	
		// Get the current song name
		var lastSongName = data.room.metadata.songlog[38].metadata.song;
		var lastSongArtist = data.room.metadata.songlog[38].metadata.artist;
		var lastSongScore = data.room.metadata.songlog[38].score;
		var lastDj = data.room.metadata.songlog[38].djname;
		var lastSongID = data.room.metadata.songlog[38]._id;

		//push to the song history collection on mongo
		db.fjpHistory.save(data.room.metadata.songlog[38]);
		
		console.log('Last Dj: ' + lastDj);
		console.log('Last song: ' + lastSongName);
		console.log('Last score: ' + lastSongScore + '\n\n'); 

		if(lastSongScore > .7 && learnMode){
	
			var scorePercentage = lastSongScore * 100;
			scorePercentage = scorePercentage.toString().substring(0,5) + '%';
			
			bot.speak('Song score was ' + scorePercentage + '.  Nice play, '+lastDj+'.  Learning.');
			
			yoink(data);
			
			//bot.speak('I think '+lastDj+' just played '+lastSongName+'.');
	
		}	
	});
	
});

bot.on('newsong', function (data) { 

	// Get the current room info
	bot.roomInfo(true, function(data) {
		
		//console.log(data);
		console.log(data.room.metadata.current_song);

		
		// Get the current song name
		var currentSong = data.room.metadata.current_song.metadata.song;
		var currentArtist = data.room.metadata.current_song.metadata.artist;
		var currentDJ = data.room.metadata.current_song.djname;
		var currentDJID = data.room.metadata.current_song.djid;
		
		
		//  no fucking george michael
		if(currentArtist == 'George Michael' || currentArtist == 'Wham!' || currentArtist == 'WHAM!' || currentArtist == 'WHAM' || currentSong.indexOf('Careless Whisper') != -1 ){
	
			bot.speak('NO FUCKING GEORGE MICHAEL.');
			bot.remDj(currentDJID);
	
		}	
	});
	
});

bot.on('update_votes', function (data) { 
	
	console.log('Someone has voted',  data.room.metadata.votelog); 
	
	// log vote here
	
});

//  global functions

function checkForDiscoMode(){

	if(discoMode){
	
		if( currentAvatar < 9 ) {
		
			currentAvatar++;
			
		} else {
		
			currentAvatar = 0;
		}
		
		bot.setAvatar(currentAvatar);
	}
}

setInterval(checkForDiscoMode, 1000); //  change avatars once per second if disco mode is engaged

function sleep(ms){

		var dt = new Date();
		
		dt.setTime(dt.getTime() + ms);
		
		while (new Date().getTime() < dt.getTime());
		
	}

function yoink(){

	if(currentDJID != TTUSERID){ // you don't yoink yer own song
	
	console.log('Adding a song to my playlist\n');		

		bot.roomInfo(true, function(data) {
		
			var newSong = data.room.metadata.current_song._id;
			var newSongName = songName = data.room.metadata.current_song.metadata.song;
		
			songCount++
			
			bot.playlistAdd(newSong, songCount);
			
			bot.snag();
			bot.speak( 'Yoink!' );
			
		});
	}
	else {
	
		bot.speak('I can\'t snag my own song, dummy.')
	
	}
	

}

function whoTo(text){  // figures out the object of a to command 

	// who are we giving this to?
	var indexOfLastTo = text.lastIndexOf('to ');
	var toArray = text.substring(indexOfLastTo + 3).split(' ');  // an array containing all words that appear after the last 'to '
	var word = '';
	var to = '';
	
	for (wordCount = 0; wordCount < toArray.length; wordCount++) {  // iterate through the words
		
		word = removePunctuation(toArray[wordCount]);
		
		word = word.toLowerCase();
		
		//bot.speak(word);
	
		if (word != 'jazzbot' || word != toArray[wordCount]) {  //  convert the word to lowercase and make sure it isnt part of the command
					
			to = to + ' ' + word;  // add this word and a space to the output phrase
					
		} else {  // if the word was 'jazzbot' or had punctuation
		
			if (word != 'jazzbot') {
			
				to = to + ' ' + word;
											
			}
				
			break; // stop building the phrase
					
		}
	}

	return (to);

}

function removePunctuation(word) {

		// remove a trailing comma if there is one (and everything after)
		if (word.lastIndexOf(',') != -1) {
	
			word = word.substring(0,word.lastIndexOf(','));
	
		}
		
		if (word.lastIndexOf('.') != -1) {
	
			word = word.substring(0,word.lastIndexOf('.'));
	
		}
		
		if (word.lastIndexOf('!') != -1) {
	
			word = word.substring(0,word.lastIndexOf('!'));
	
		}
		
		if (word.lastIndexOf('?') != -1) {
	
			word = word.substring(0,word.lastIndexOf('?'));
	
		}

	return (word);

}

function printPlaylist(){

	bot.playlistAll(function(data){
		
		myPlaylist = data.list;
		
		//console.log(myPlaylist);
		//console.log('\n\n');
		
		
		for(i=0;i < myPlaylist.length;i++){
		
			console.log(myPlaylist[i].metadata.song);
		
		}
		
		songCount = myPlaylist.length;
		
		console.log('\n');
		console.log('Playlist count: ' + songCount);
		
		bot.speak('I have ' + songCount + ' songs in my playlist.'); 
	
	});

}

function getSongCount(){

	bot.playlistAll(function(data){
		
		myPlaylist = data.list;
		
		songCount = myPlaylist.length;
		
		console.log('\n');
		console.log('Playlist count: ' + songCount);
		
		bot.speak('I have ' + songCount + ' songs in my playlist.'); 
	
	});

}


//  functions needed for afk checker, taken from Alain's example

justSaw = function (uid) {

   return lastSeen[uid] = Date.now();
   
};

isAfk = function (userId, num) {

   var last = lastSeen[userId];
   var age_ms = Date.now() - last;
   var age_m = Math.floor(age_ms / 1000 / 60);
   
   if (age_m >= num) {
   
      return true;
	  
   };
   
   return false;
   
};

afkCheck = function () {

   var afkLimit = 10; //An Afk Limit of 10 minutes.
   
   for (i = 0; i < djs.length; i++) {
   
      dj = djs[i]; //Pick a DJ
	  
      if (isAfk(dj, afkLimit)) { //if Dj is afk then
	  
         bot.remDj(dj); //remove them
		 
      }; 
   };
};

// uncomment line below for afk check
// setInterval(afkCheck, 5000) //This repeats the check every five seconds.

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	