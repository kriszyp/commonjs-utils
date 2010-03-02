// Creates a custom error that extends JS's Error
exports.ErrorConstructor = function(name, superError){
	superError = superError || Error;
	function ExtendedError(message){
		var e = new Error(message);
		e.name = name;
		var ee = Object.create(ExtendedError.prototype);
		for(var i in e){
			ee[i] = e[i];
		}
		return ee;
	}
	ExtendedError.prototype = Object.create(superError.prototype);
	ExtendedError.prototype.name = name;
	return ExtendedError;
};