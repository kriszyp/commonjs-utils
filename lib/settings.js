var fs = require("commonjs-utils/fs-promise");

var settings = JSON.parse(fs.read("local.json"));
for(var i in settings){
	exports[i] = settings[i];
}