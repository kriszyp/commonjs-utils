try{
	var read = require("fs").readFileSync;
}catch(e){
	read = require("file").read;
}

var settings = JSON.parse(read("local.json").toString("utf8"));
for(var i in settings){
	exports[i] = settings[i];
}