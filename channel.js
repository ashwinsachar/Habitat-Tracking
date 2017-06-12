(function () {
    channel = function(data) {
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

        
        require('./relevanceFilt.js');
        // for(var i = 0; i < animal_list.length; i++){
            // if(text.includes(animal_list[i])){
                                
                if(text.search("rabbit") != -1){ //|| text.search("rabbits") != -1){
                    channel_list.push("rabbit");
                }
                if (text.search("squirrel") != -1){ //|| text.search("squirrels") != -1){
                    channel_list.push("squirrel");
                }
                if (text.search("raccoon") != -1){ //|| text.search("raccoons") != -1){
                    channel_list.push("raccoon");
                }
                if (hasAnimal(birds_list, text)){
                    channel_list.push("bird");
                }
                if (text.search("wolf") != -1|| text.search("wolves") != -1){
                    channel_list.push("wolf");
                }
                if (text.search("lion") != -1){ //|| text.search("lions") != -1){
                    channel_list.push("lion");
                }
                if (text.search("fox") != -1){ //|| text.search("foxes") != -1){
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
        
        
    function hasAnimal(animal_list, text){
        for (var i = 0; i < animal_list.length; i++){
            if(text.search(animal_list[i]) != -1){
                return true;
            }
        }
        return false;
    }

    return channel_list; 

}
   
})();
