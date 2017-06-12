

/*
//sample json
var json = [{"text":"I just saw rabbits at the park today! The rabbits were so cute. #rabbit #rabbits",
"entities":{"hashtags":[{"text":"rabbit","indices":[6,16]},{"text":"rabbits","indices":[10,16]}],"urls":[],"user_mentions":[]},
"coordinates":{"coordinates":[-75.14310264,40.05701649],"type":"Point"},
"created_at":"Wed May 31 2017 17:20:35 GMT-0700 (Pacific Daylight Time)",
"geo":null,
"current_time": "Sun Jun 04 2017 20:59:00 GMT-0700 (Pacific Daylight Time)",
"current_coords": [-118.1254502,34.0547579]}];
 */

(function () {
	relevanceFilt = function (json, channel) {
		/*
		This function will take in a json of publications and a channel as a string and analyze relevance.
		It will return the sight value, location value, and time value ("HIGH" or "LOW")
		for each publication in an array
		 */
		var natural = require('natural');

		stemmer = natural.PorterStemmer;
		tokenizer = new natural.RegexpTokenizer({
				pattern: / /
			}); //tokenize per space character
		tokenizer1 = new natural.RegexpTokenizer({
				pattern: /:/
			}); //tokenizer per : character


		var textContent = [];
		var text,
		textSplit;
		var hashtag;
		var location1,
		location2;
		var distanceX,
		distanceY,
		distance;
		var distanceThresh = 1;
		var currTime,
		createTime;
		var match;
		var currDigits,
		createDigits;
		var sightScore = 0;
		var locScore = 0;
		var timeScore = 0;
		var sightWords = ["see", "saw", "watch", "look", "notice", "observe", "spot", "witness", "found", "encounter",
			"seen"];
		var objWords = ["movie", "film", "tv", "television", "book", "sticker", "flyer", "art", "illustration", "drawing",
			"painting", "piece", "sport", "acrylics", "collage", "watercolor"];
		var timeWords1 = ["just", "now"];
		var timeWords2 = ["recently", "lately", "today", "on"];
		var timeWords3 = ["yesterday", "week", "hour", "ago"];
		var locWords = ["there", "near", "here", "where", "on", "in", "nearby", "at", "close", "by", "along"];
		var hashWords = ["monitor", "wildlife", "habitat", "nature", "environment", "conservation", "animal", "animals",
			"photography", "nationalparks", "nationalpark"];
		var birds_list = ["albatross", "auk", "bird", "birdies", "blue jay", "bulbul", "cardinal", "chickadee", "cormorant", "crow",
			"crane", "cuckoo", "dove", "eagle", "falcon", "finch", "fowl", "fregatidae", "flycatcher", "geese",
			"goose", "grosbeak", "grouse", "gull", "heron", "hornbill", "hummingbird", "kingfisher", "kiwi",
			"moa", "nighthawk", "owl", "parrot", "parula", "passerine", "penguin", "pelican", "pigeon", "plover",
			"potoo", "rhea", "robin", "sandpiper", "serin", "shearwater", "sparrow", "spoonbill", "starling",
			"stork", "swallow", "swift", "tern", "towhee", "toucan", "vireo", "warbler", "woodpecker", "whyday",
			"wren"];
		var dogs_list = ["dog", "doggie", "puppy", "doggy", "husky", "pug", "labrador", "beagle", "german shepherd",
			"rottweiler", "pit bull", "poodle", "shih tzu", "doberman", "boxer", "chow chow",
			"chihuahua", "great dane", "terrier", "dachshund", "maltese", "pomeranian", "mastiff",
			"st. bernard", "greyhound", "malamute", "spaniel", "golden retriever", "bulldog", "shiba inu",
			"corgi"];
		var cats_list = ["cat", "kitty", "kitten", "persian cat", "siamese cat", "maine coon", "ragdoll", "exotic shorthair",
			"abyssinian cat", "sphynx cat", "american shorthair", "british shorthair", "birman",
			"bengal cat", "burmese cat", "scottish fold", "russian blue", "norwegian forest cat",
			"oriental shorthair", "himalayan cat", "siberian cat", "devon rex", "manx cat"];
		var sightVal,
		locVal,
		timeVal;
		var sightThresh = 1.5;
		var locThresh = 0.5;
		var timeThresh = 0.5;
		var relevance = [];

		for (var i = 0; i < json.length; i++) {
			text = json[i].text; //read text of publication
			textSplit = tokenizer.tokenize(text); //split text at every space
			//remove hashtags from text string array
			for (var j = 0; j < textSplit.length; j++) {
				if (textSplit[j][0] != "#") {
					textContent.push(textSplit[j]);
				}
			}
			//put text string array back into one string
			text = "";
			for (var j = 0; j < textContent.length; j++) {
				if (textContent.length == 1) {
					text = textContent[0];
				} else if (j < textContent.length - 1) {
					text = text.concat(textContent[j] + " ");
				} else {
					text = text.concat(textContent[j]);
				}
			}
			//split up text into each word and stem them (remove conjugation, tense, form to get root word)
			stemmer.attach();
			text = text.tokenizeAndStem(true);
			//remove duplicate words
			var uniqueText = text.filter(function (elem, index, self) {
					return index == self.indexOf(elem);
				})

				//put all hashtags into one string array
				hashtag = "";
			if (json[i].entities.hashtags.length == 0) {
				hashtag = "";
			} else if (json[i].entities.hashtags.length == 1) {
				hashtag = json[i].entities.hashtags[0].text;
			} else {
				for (var j = 0; j < json[i].entities.hashtags.length; j++) {
					if (j < json[i].entities.hashtags.length - 1) {
						hashtag = hashtag.concat(json[i].entities.hashtags[j].text + " ");
					} else {
						hashtag = hashtag.concat(json[i].entities.hashtags[j].text);
					}
				}

			}
			hashtag = hashtag.toLowerCase();
			//split up hashtags into each word
			hashtag = tokenizer.tokenize(hashtag);
			//remove duplicate words
			var uniqueHash = hashtag.filter(function (elem, index, self) {
					return index == self.indexOf(elem);
				});

			//analyze text
			for (var j = 0; j < uniqueText.length; j++) {
				//check if text includes channel word
				if (uniqueText[j] == channel) {
					sightScore = sightScore + 1;
				}
				//check if text includes any sight words
				for (var k = 0; k < sightWords.length; k++) {
					if (uniqueText[j] == sightWords[k]) {
						sightScore = sightScore + 1;
					}
				}
				//check if text includes any object words
				for (var k = 0; k < objWords.length; k++) {
					if (uniqueText[j] == objWords[k]) {
						sightScore = sightScore - 1;
					}
				}
				//check if text includes "just" or "now"
				for (var k = 0; k < timeWords1.length; k++) {
					if (uniqueText[j] == timeWords1[k]) {
						timeScore = timeScore + 1;
					}
				}
				//check if text includes "recently", "lately", "today"
				for (var k = 0; k < timeWords2.length; k++) {
					if (uniqueText[j] == timeWords2[k]) {
						timeScore = timeScore + 0.5;
					}
				}
				//check if text includes "yesterday", "week", "hour", "ago"
				for (var k = 0; k < timeWords3.length; k++) {
					if (uniqueText[j] == timeWords3[k]) {
						timeScore = timeScore - 1;
					}
				}
				//check if text includes any location words
				for (var k = 0; k < locWords.length; k++) {
					if (uniqueText[j] == locWords[k]) {
						locScore = locScore + 1;
					}
				}
				//check if text includes a particular type of the channel animal
				if (channel == "bird") {
					for (var k = 0; k < birds_list.length; k++) {
						if (uniqueText[j] == birds_list[k]) {
							sightScore = sightScore + 1;
						}
					}
				} else if (channel == "dog") {
					for (var k = 0; k < dogs_list.length; k++) {
						if (uniqueText[j] == dogs_list[k]) {
							sightScore = sightScore + 1;
						}
					}
				} else if (channel == "cat") {
					for (var k = 0; k < cats_list.length; k++) {
						if (uniqueText[j] == cats_list[k]) {
							sightScore = sightScore + 1;
						}
					}
				} else {
					sightScore = sightScore;
				}
			}

			//analyze hashtags
			if (uniqueHash.length > 0) {
				for (var j = 0; j < uniqueHash.length; j++) {
					//check if hashtags include channel word
					if (uniqueHash[j] == channel) {
						sightScore = sightScore + 1;
					}
					//check if hashtags include certain hashtag words
					for (var k = 0; k < hashWords.length; k++) {
						if (uniqueHash[j] == hashWords[k]) {
							sightScore = sightScore + 0.5;
						}
					}
					//check if hashtags include animal breed name
					if (channel == "bird") {
						for (var k = 0; k < birds_list.length; k++) {
							if (uniqueHash[j] == birds_list[k]) {
								sightScore = sightScore + 1;
							}
						}
					} else if (channel == "dog") {
						for (var k = 0; k < dogs_list.length; k++) {
							if (uniqueHash[j] == dogs_list[k]) {
								sightScore = sightScore + 1;
							}
						}
					} else if (channel == "cat") {
						for (var k = 0; k < cats_list.length; k++) {
							if (uniqueHash[j] == cats_list[k]) {
								sightScore = sightScore + 1;
							}
						}
					} else {
						sightScore = sightScore;
					}
					//check if hashtags include object words
					for (var k = 0; k < objWords.length; k++) {
						if (uniqueHash[j] == objWords[k]) {
							sightScore = sightScore - 1;
						}
					}
				}
			} else {
				sightScore = sightScore;
				locScore = locScore;
				timeScore = timeScore;
			}

			//compute distance between current coordinates and GPS coordinates of device
			location1 = json[i].coordinates.coordinates;
			location2 = json[i].current_coords;
			//check if current_coords or coordinates are missing input
			if (location1.length == 0 && location2.length == 0) {
				locScore = locScore - 1;
			} else if (location1.length == 0 && location2.length != 0) {
				locScore = locScore - 0.5;
			} else if (location1.length != 0 && location2.length == 0) {
				locScore = locScore - 0.5;
			} else {
				distanceX = 69.1 * (location1[0] - location2[0]);
				distanceY = 53.0 * (location1[1] - location2[1]);
				distance = Math.sqrt(Math.abs(distanceX * distanceX - distanceY * distanceY));

				//analyze relevance according to distance
				if (distance == 0) {
					locScore = locScore + 1;
				} else if (distance > 0 && distance <= distanceThresh) {
					locScore = locScore + 0.5;
				} else {
					locScore = locScore - 1;
				}
			}

			//analyze current time and publication time
			if (json[i].created_at.length == 0 && json[i].current_time == 0) {
				timeScore = timeScore - 1;
			} else if (json[i].created_at.length == 0 && json[i].current_time != 0) {
				timeScore = timeScore - 0.5;
			} else if (json[i].created_at.length != 0 && json[i].current_time == 0) {
				timeScore = timeScore - 0.5;
			} else {
				if (json[i].created_at == json[i].current_time) {
					timeScore = timeScore + 1;
				} else {
					createTime = tokenizer.tokenize(json[i].created_at);
					currTime = tokenizer.tokenize(json[i].current_time);

					if (currTime[0] == createTime[0]) {
						if (currTime[1] == createTime[1]) {
							if (currTime[2] == createTime[2]) {
								if (currTime[3] == createTime[3]) {
									match = true;
								} else {
									match = false;
								}
							} else {
								match = false;
							}
						} else {
							match = false;
						}
					} else {
						match = false;
					}
					
					if (match) {
						currDigits = tokenizer1.tokenize(currTime[4]);
						createDigits = tokenizer1.tokenize(createTime[4]);
						if (Math.abs(currDigits[0] - createDigits[0]) >= 0 && Math.abs(currDigits[0] - createDigits[0]) <= 1) {
							timeScore = timeScore + 1;
						} else if (Math.abs(currDigits[0] - createDigits[0]) > 1 && Math.abs(currDigits[0] - createDigits[0]) <= 3) {
							timeScore = timeScore + 0.5;
						} else {
							timeScore = timeScore - 1;
						}
					}
				}
			}

			//determine high or low according to threshold value
			if (sightScore > sightThresh) {
				sightVal = "HIGH";
			} else {
				sightVal = "LOW";
			}
			if (locScore >= locThresh) {
				locVal = "HIGH";
			} else {
				locVal = "LOW";
			}
			if (timeScore > timeThresh) {
				timeVal = "HIGH";
			} else {
				timeVal = "LOW";
			}

			var reported_time = json[i].created_at;

			pub = {
				channel: channel,
				sighting: sightVal,
				coordinates: location1,
				location: locVal,
				time_seen: reported_time,
				time: timeVal
			};
			relevance.push(pub);
		}

		return relevance;
	}
})();
