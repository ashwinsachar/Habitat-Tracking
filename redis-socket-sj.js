//Port config
const PORT = 3000;
 
//Requires and main server objects
var redis = require('redis');
// var http = require('http');
// var io = require('socket.io')(http);

var fs = require('fs');
var creds = '';

var util = require('util');
var qs = require('querystring');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var bodyParser = require('body-parser');

// app.get('/', function(req, res){
//   res.sendFile(__dirname + './views/form.html');
// });

// Express Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));



http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});
// Render Main HTML file
app.get('/', function (req, res) {
    res.sendFile('views/form.html', {
        root: __dirname
    });
});

app.post('/', function (req, res) {
    res.render('views/form.html', { tags: req.body.tags });
});

require('./relevanceFilt.js');
 
//This object will contain all the channels being listened to.
var global_channels = {};
 
// http.listen(PORT, function () {
//     console.log('Server Started. Listening on *:' + PORT);
// }); 

// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

// // Render Main HTML file
// app.get('/', function (req, res) {
//     res.sendFile('views/form.html', {
//         root: __dirname
//     });
// });
//Server Logic goes here

var json =''

// var server = http.createServer(function (req, res) {
//     if (req.method.toLowerCase() == 'get') {
//         displayForm(res);
//     } else if (req.method.toLowerCase() == 'post') {
//         processAllFieldsOfTheForm(req, res);
//     }

// });

function tagsToJSON(data){
	var text = "";
	var items = data.split(',');
	for(var i = 0; i < items.length; i++){
		text = text + "{\"text\": \"" + items[i].trim() + "\",\"indicies\":[0,0]}";
		if(i != items.length - 1){
			text = text + ",";
		}
	}
	
	// {
		// "text": "Loved #devnestSF",
		// "entities": {
			// "hashtags": [{
				// "text": "devnestSF",
				// "indices": [6,16]}],
			// "urls":[],
			// "user_mentions":[]
		// },
		// "coordinates":
		// {
			// "coordinates":
			// [
				// -75.14310264,
				// 40.05701649
			// ],
			// "type":"Point"
		// },
		// "created_at": "Sun Apr 03 23:48:36 +0000 2011", 
		// "geo":null,
		// "current_time": "Sun Jun 04 2017 20:59:00 GMT-0700 (Pacific Daylight Time)",
		// "current_coords": [-118.1254502,34.0547579]
	// }
	
	return text;
}

function formToJSON(data){
	var jsondata;
	var text = "";
	
	text = "{\"text\":\"" + data.text + "\","
			+ "\"entities\": {"
			+ "\"hashtags\": " + "[" + tagsToJSON(data.tags) + "],"
			+ "\"urls\":[],"
			+ "\"user_mentions\":[]},"
			+ "\"coordinates\": {"
			+ "\"coordinates\": [" + data.coords
			+ "], \"type\":\"Point\" },"
			+ "\"created_at\": \"" + data.time + "\","
			+ "\"geo\":null,"
			+ "\"current_time\": \"" + data.current_time +  "\"," //time and coordinates appended to twitter data
			+ "\"current_coords\": [" + data.current_coords + "]" //add comma if there's another field after
			+ "}";
	
	//note: if pulling from actual twitter data, we might not be able to do comparisons
	//e.g. if they tweeted days later, the created_at and coordinates might not reflect where they saw it...
	
	// jsondata = text;
	jsondata = JSON.parse(text);
	return jsondata;
}

function displayForm(res) {
	
    fs.readFile('./views/form.html', function (err, data) {
    	if(err) throw err;
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function processAllFieldsOfTheForm(req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                request.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
			
			jsondata = [formToJSON(post)];
			
			// res.write(JSON.stringify(jsondata.entities.hashtags)); //use stringify if you want to see what's in the object
			// res.write(jsondata.text); //res.write to test and see what values you're getting
			// res.write(jsondata);
			res.write(JSON.stringify(jsondata)); //uncomment to see how the data looks like after form is submitted
			
			//Filtering goes here
			// var score = relevanceFilt(jsondata,channel_name);
			
			res.end();

        });
		
	}
	
}


var json = [{"text":"I just saw rabbits at the park today! The rabbits were so cute. #rabbit #rabbits",
            "entities":{"hashtags":[{"text":"rabbit","indices":[6,16]},{"text":"rabbits","indices":[10,16]}],"urls":[],"user_mentions":[]},
            "coordinates":{"coordinates":[-75.14310264,40.05701649],"type":"Point"},
            "created_at":"Wed May 31 2017 17:20:35 GMT-0700 (Pacific Daylight Time)",
            "geo":null}];

fs.readFile('creds.json', 'utf-8', function (err, data) {
    if (err) throw err;
    creds = JSON.parse(data);
    });


//Create a socket connection
io.on('connection', function(socketconnection){
 	
//All the channels this connection subscribes to
	socketconnection.connected_channels = {}
 	
//Subscribe request from client
	socketconnection.on('subscribe', function(channel_name){
		// console.log('Socket id subscribed: ' + socketconnection.id);
//Set up Redis Channel
	console.log('Server side received, channel name: ' + channel_name);
	if (global_channels.hasOwnProperty(channel_name)){
//If channel is already present, make this socket connection one of its listeners
		global_channels[channel_name].listeners[socketconnection.id] = socketconnection;
	}
	else{
	//Else, initialize new Redis Client as a channel and make it subscribe to channel_name
		global_channels[channel_name] = redis.createClient('redis://' + creds.user + ':' + creds.password + '@' + creds.host + ':' + creds.port);
		global_channels[channel_name].subscribe(channel_name);
		global_channels[channel_name].listeners = {};
		//Add this connection to the listeners
		global_channels[channel_name].listeners[socketconnection.id] = socketconnection;
		// console.log(global_channels[channel_name].listeners);

		
		}

		socketconnection.connected_channels[channel_name] = global_channels[channel_name];
	 
	 });
	 
	
	

	socketconnection.on('message', function (data){

		var text = data.text.toLowerCase();
		var channel_name = "";
		var channel_list = [];
		var animal_list = ["rabbit", "rabbits", 
							"squirrel", "squirrels",
							"raccoon", "raccoons",
							"bird", "birds",
							"wolf", "wolves",
							"lion", "lions",
							"fox", "foxes",
							"dog", "dogs",
							"cat", "cats",
							"mouse", "mice"];
							
		var birds_list = ["bird", "birds", "parrot", "hummingbird", "penguin", "owl", "crane", "cuckoo", "toucan", "sparrow", "kingfisher", "heron", "passerine", "stork", "swallow", "woodpecker", "albatross", "gull", "moa", "potoo", "bulbul", "hornbill", "goose", "geese", "falcon", "rhea", "plover", "tern", "sandpiper", "fregatidae", "cormorant", "swift", "kiwi", "fowl", "grouse", "auk", "spoonbill", "woodpecker", "finch", "owl", "robin", "dove", "pigeon", "crow", "starling", "blue jay", "warbler", "chickadee", "cardinal", "gull"];

		var dogs_list = ["dog", "dogs", "doggie", "puppy", "doggy", "husky", "pug", "labrador", "beagle", "german shepherd", "rottweiler", "pit bull", "poodle", "shih tzu", "doberman", "boxer", "chow chow", "chihuahua", "great dane", "terrier", "dachshund", "maltese", "pomeranian", "mastiff", "st. bernard", "greyhound", "malamute", "spaniel", "golden retriever", "bulldog", "shiba inu", "corgi"];
		
		var cats_list = ["cat", "cats", "kitty", "kitten"];

		// for(var i = 0; i < animal_list.length; i++){
			// if(text.includes(animal_list[i])){
								
				if(text.search("rabbit") != -1|| text.search("rabbits") != -1){
					channel_list.push("rabbit");
				}
				if (text.search("squirrel") != -1|| text.search("squirrels") != -1){
					channel_list.push("squirrel");
				}
				if (text.search("raccoon") != -1|| text.search("raccoons") != -1){
					channel_list.push("raccoon");
				}
				if (hasAnimal(birds_list, text)){
					channel_list.push("bird");
				}
				if (text.search("wolf") != -1|| text.search("wolves") != -1){
					channel_list.push("wolf");
				}
				if (text.search("fox") != -1|| text.search("foxes") != -1){
					channel_list.push("fox");
				}
				if (hasAnimal(dogs_list, text)){
					channel_list.push("dog");
				}
				if (hasAnimal(cats_list, text)){
					channel_list.push("cat");
				}
				if (text.search("mouse") != -1|| text.search("mice") != -1){
					channel_list.push("mouse");
				}
			// }
		// }
		
		var score;
		var coordinates = data.coords;;
		
 		// console.log('Json data:  '+ JSON.stringify(formToJSON(data)));
 		// var channel_name = data.tags;

		for(var i = 0; i < channel_list.length; i++){
			channel_name = channel_list[i];
				
			score = relevanceFilt([formToJSON(data)],channel_name);
			
			console.log('Score of data: ' + JSON.stringify(score) + "\n");
			
			// if(Object.keys(global_channels[channel_name].listeners).length != -1){
				// Object.keys(global_channels[channel_name].listeners).forEach(function(key){
					// // console.log(global_channels[channel_name].listeners[key].id);
					// if(global_channels[channel_name].listeners[key].id != socketconnection.id){
						// // console.log('Inside Message received at the server end from: ' + socketconnection.id);
						// console.log(score[0]['channel']);
						// // console.log(channel_name);
						// if(score[0]['sighting'] == 'HIGH' && score[0]['location'] == 'LOW' && score[0]['time'] == 'LOW'){
							// global_channels[channel_name].listeners[key].send(coordinates);
						// }
						
					// }
					
			// });
			
			// }
			// else{
				// console.log('List global channels is empty: Length is -' + Object.keys(global_channels).length);
			// }
		}
 	});

	function hasAnimal(animal_list, text){
		for (var i = 0; i < animal_list.length; i++){
			if(text.search(animal_list[i]) != -1){
				return true;
			}
		}
		return false;
	}
	
	//Backup
 	// socketconnection.on('message', function (channel_name){
 	// // 	var score = relevanceFilt(json,channel_name);
		// var coordinates = json[0]['coordinates']['coordinates'];
	 // // 	console.log('Score of data: ' + score);
 		
 	// 	if(Object.keys(global_channels[channel_name].listeners).length != -1){
 	// 		Object.keys(global_channels[channel_name].listeners).forEach(function(key){
 	// 			// console.log(global_channels[channel_name].listeners[key].id);
 	// 			if(global_channels[channel_name].listeners[key].id != socketconnection.id){
 	// 				// console.log('Inside Message received at the server end from: ' + socketconnection.id);
		// 			// console.log(score['channel']);
		// 			// console.log(channel_name);
		// 			// if(score['channel'] == channel_name.toString()){
		// 				global_channels[channel_name].listeners[key].send(coordinates);
		// 			// }
 					
 	// 			}
 				
 	// 	});
        
 	// 	}
 	// 	else{
 	// 		console.log('List global channels is empty: Length is -' + Object.keys(global_channels).length);
 	// 	}
 	// 	});
 	
	//Unsubscribe request from client
	socketconnection.on('unsubscribe', function(channel_name){
			// console.log('Socket id unsubscribed: ' + socketconnection.id);
			if (socketconnection.connected_channels.hasOwnProperty(channel_name)){
			//If this connection is indeed subscribing to channel_name
			//Delete this connection from the Redis Channel's listeners
			delete global_channels[channel_name].listeners[socketconnection.id];
			//Delete channel from this connection's connected_channels
			delete socketconnection.connected_channels[channel_name];
		}
	});
	 
	//Disconnect request from client or Log out
	socketconnection.on('disconnect', function(){
	//Remove this connection from listeners' lists of all channels it subscribes to
		Object.keys(socketconnection.connected_channels).forEach(function(channel_name){
			delete global_channels[channel_name].listeners[socketconnection.id];
			});
		});
});

