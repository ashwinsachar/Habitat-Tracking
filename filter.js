/*
var json = [{"text":"I just saw rabbits at the park today! The rabbits were so cute. #rabbit #rabbits",
            "entities":{"hashtags":[{"text":"rabbit","indices":[6,16]},{"text":"rabbits","indices":[10,16]}],"urls":[],"user_mentions":[]},
            "coordinates":{"coordinates":[-75.14310264,40.05701649],"type":"Point"},
            "created_at":"Wed May 31 2017 17:20:35 GMT-0700 (Pacific Daylight Time)",
            "geo":null}];
*/

(function() {
filter = function(json) {
    
    /*
     This function will take in a json of publications and filter the data.
     It will return the sight value, location value, and time value ("HIGH" or "LOW")
     for each publication in an array
     */
    
    
    var natural = require('natural');
    
    
    stemmer = natural.PorterStemmer;
    tokenizer = new natural.RegexpTokenizer({pattern:/ /}); //tokenize per space character
    
    
    var textContent = [];
    var text, textSplit;
    var hashtag;
    var sightScore = 0;
    var locScore = 0;
    var timeScore = 0;
    var channel = "rabbit";
    var sightWords = ["see", "saw", "watch", "look", "notice", "observe", "spot", "witness"];
    var objWords = ["movie", "film", "tv", "television", "book", "sticker", "flyer"];
    var timeWords1 = ["just", "now"];
    var timeWords2 = ["recently", "lately", "today"];
    var timeWords3 = ["yesterday", "week", "hour", "ago"];
    var locWords = ["there", "near", "here", "where", "on", "in", "nearby", "at", "close"];
    var sightVal, locVal, timeVal;
    var thresh = 1; //change as needed
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
        var uniqueText = text.filter(function(elem,index,self) {
                                     return index == self.indexOf(elem);
                                     })
        
        //put all hashtags into one string array
        hashtag = "";
        for (var j = 0; j < json[i].entities.hashtags.length; j++) {
            if (json[i].entities.hashtags.length == 0) {
                hashtag = json[i].entities.hashtags[0].text;
            } else if (j < json[i].entities.hashtags.length - 1) {
                hashtag = hashtag.concat(json[i].entities.hashtags[j].text + " ");
            } else
                hashtag = hashtag.concat(json[i].entities.hashtags[j].text);
        }
        //split up hashtags into each word and stem them (remove conjugation, tense, form to get root word)
        hashtag = stemmer.tokenizeAndStem(hashtag);
        //remove duplicate words
        var uniqueHash = hashtag.filter(function(elem,index,self) {
                                        return index == self.indexOf(elem);
                                        })
        
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
                    console.log("got here");
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
        }
        
        //analyze hashtags
        for (var j = 0; j < uniqueHash.length; j++) {
            //check if hashtags include channel word
            if (uniqueHash[j] == channel) {
                sightScore = sightScore + 1;
            }
        }
        
        //determine high or low according to threshold value
        if (sightScore > thresh) {
            sightVal = "HIGH";
        } else {
            sightVal = "LOW";
        }
        if (locScore > thresh) {
            locVal = "HIGH";
        } else {
            locVal = "LOW";
        }
        if (timeScore > thresh) {
            timeVal = "HIGH";
        } else {
            timeVal = "LOW";
        }
        
        pub = {channel:channel, sighting:sightVal, location:locVal, time:timeVal};
        relevance.push(pub);
    }
    
    return relevance;
}
})();