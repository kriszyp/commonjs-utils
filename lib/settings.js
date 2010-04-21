var fs = require("fs-promise");

var settings = JSON.parse(fs.readFileSync("local.json"));
for(var i in settings){
	exports[i] = settings[i];
}