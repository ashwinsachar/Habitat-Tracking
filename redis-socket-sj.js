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

// Express 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));



http.listen(process.env.PORT || PORT, function(){
  console.log('listening on *:' + process.env.PORT);
});
// Render Main HTML file
app.get('/', function (req, res) {
    res.sendFile('views/form.html', {
        root: __dirname
    });
});


require('./channel.js');
 
//This object will contain all the channels being listened to.
var global_channels = {};
 
//Server Logic goes here





function tagsToJSON(data){
	var text = "";
	var items = data.split(',');
	if(items.length > 0){
		for(var i = 0; i < items.length; i++){
			text = text + "{\"text\": \"" + items[i].trim() + "\",\"indicies\":[0,0]}";
			if(i != items.length - 1){
				text = text + ",";
			}
		}
	}
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
	var data = {
		text: channel_name
	}
	var channel_list = channel(data);
    for(var i = 0; i < channel_list.length; i++){
        channel_name = channel_list[i];
		console.log('Subscribed to: ' + channel_name);
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
		 }
	 });

	socketconnection.on('message', function (data){
		
		var score = [];
        
        // console.log('Json data:  '+ JSON.stringify(formToJSON(data)));
        // var channel_name = data.tags;
        var channel_list = channel(data);
        for(var i = 0; i < channel_list.length; i++){
            channel_name = channel_list[i];
			// console.log(data.type);
			if(data.type == "form"){
				score.push(relevanceFilt([formToJSON(data)],channel_name));
			}
			else{
				score.push(relevanceFilt([data],channel_name));
			}
            
            // console.log('Score of data: ' + JSON.stringify(score) + "\n");
            
            
        }

 		
 		// console.log("Length of score: " + score.length);
 		// console.log('Json data:  '+ JSON.stringify(formToJSON(data)));
		// var coordinates = data.coords;
		console.log("\n---");
		console.log("\nText: " + data.text);
	 	console.log('\nGenerated Scores: ');
		
		for(var i = 0; i < score.length; i++){
			console.log('\t ' + JSON.stringify(score[i]));
		}
		
		console.log('\nScores of Interest to the User: ');
	 	for(var i = 0; i < score.length; i++){
 			var channel_name = score[i][0]['channel'];
			var chance_of_sighting = score[i][0]['sighting'];
			var coords = score[i][0]['coordinates'];
			var chance_of_location = score[i][0]['location'];
			var reported_time = score[i][0]['time_seen'];
			var chance_of_time = score[i][0]['time'];
			var info_to_send = [channel_name, chance_of_sighting, coords, chance_of_location, reported_time, chance_of_time, info_to_send];

 			// console.log("Channel_name: " +channel_name);
	 		if (global_channels.hasOwnProperty(channel_name)){
				// console.log('\t ' + JSON.stringify(score[i]));

		 		if(Object.keys(global_channels[channel_name].listeners).length != -1){
		 			Object.keys(global_channels[channel_name].listeners).forEach(function(key){
						console.log('\t ' + JSON.stringify(score[i]));
		 				// console.log(global_channels[channel_name].listeners[key].id);
		 				// if(global_channels[channel_name].listeners[key].id != socketconnection.id){
		 					// console.log('Inside Message received at the server end from: ' + socketconnection.id);
							// console.log(score[0]['channel']);
							// console.log(channel_name);
							// Filter data
							// if(score[i][0]['sighting'] == 'HIGH' && score[i][0]['location'] == 'HIGH' && score[i][0]['time'] == 'HIGH'){
								// global_channels[channel_name].listeners[key].send(data);
								global_channels[channel_name].listeners[key].send(info_to_send);
							// }
		 					
		 				// }
		 				
		 		});
		        
		 		}
		 		else{
		 			console.log('List global channels is empty: Length is -' + Object.keys(global_channels).length);
		 		}
		 	}
			else{
	 		// console.log('Discarded message. Sorry, not sorry, stop posting shit no one is interested in :P');
				console.log('\nUser is not subscribed to ' + channel_name + " channel.\n");
	 		}
 		}
 	});

	
 	
	//Unsubscribe request from client
	socketconnection.on('unsubscribe', function(channel_name){
		
		var data = {
			text: channel_name
		}
		var channel_list = channel(data);
		for(var i = 0; i < channel_list.length; i++){
			channel_name = channel_list[i];
			// console.log('Socket id unsubscribed: ' + socketconnection.id);
			if (socketconnection.connected_channels.hasOwnProperty(channel_name)){
				//If this connection is indeed subscribing to channel_name
				//Delete this connection from the Redis Channel's listeners
				console.log("Unsubscribed from: " + channel_name);
				delete global_channels[channel_name].listeners[socketconnection.id];
				//Delete channel from this connection's connected_channels
				delete socketconnection.connected_channels[channel_name];
			}
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
