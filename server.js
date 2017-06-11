var http = require('http');
var fs = require('fs');
var util = require('util');
var qs = require('querystring');

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        displayForm(res);
    } else if (req.method.toLowerCase() == 'post') {
        processAllFieldsOfTheForm(req, res);
    }

});

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
			
			
			res.end();

        });
		
	}
	
}
var portnum = 8080;
server.listen(portnum);
console.log("server listening on", portnum);
