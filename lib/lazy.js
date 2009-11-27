exports.extendSome = function(hasSomeAndLength){
	return new SomeWrapper(hasSomeAndLength);
};
exports.first = function(array){
	return exports.get(array, 0);
};
exports.last = function(array){
	return exports.get(array, array.length-1);
};
exports.get = function(array, index){
	var result, i = 0;
	array.some(function(item){
		if(i == index){
			result = item;
			return true;
		}
		i++;
	});
	return result;
};


var testProto = {};
var testProto2 = testProto.__proto__ = testProto2; 
var mutableProto = testProto.__proto__ === testProto2;
function SomeWrapper(hasSomeAndLength){
	if(mutableProto){
		hasSomeAndLength.source = hasSomeAndLength;
		hasSomeAndLength.__proto__ = SomeWrapper.prototype;
		return hasSomeAndLength;
	}
	this.source = hasSomeAndLength;
	this.length= hasSomeAndLength.length;
	this.totalCount = hasSomeAndLength.totalCount;
}
SomeWrapper.prototype = [];
SomeWrapper.prototype.some = function(callback){
	this.source.some(callback);
}
SomeWrapper.prototype.filter = function(fn, thisObj){
	var result = [];
	this.source.some(function(item){
		if(fn.call(thisObj, item)){
			results.push(item);
		}
	});
	return results;
};

SomeWrapper.prototype.every = function(fn, thisObj){
	return !this.source.some(function(item){
		if(!fn.call(thisObj, item)){
			return true;
		}
	});
};
SomeWrapper.prototype.forEach= function(fn, thisObj){
	this.source.some(function(item){
		fn.call(thisObj, item);
	});
};
SomeWrapper.prototype.concat = function(someOther){
	var source = this.source;
	return new SomeWrapper({
		length : source.length + someOther.length,
		some : function(fn,thisObj){
			return source.some(fn,thisObj) ||
				someOther.some(fn,thisObj);
		}
	});
};
SomeWrapper.prototype.map = function(mapFn, mapThisObj){
	var source = this.source;
	return new SomeWrapper({
		length : source.length,
		some : function(fn,thisObj){
			source.some(function(item){
				fn.call(thisObj, mapFn.call(mapThisObj, item));
			});
		}
	});
};
SomeWrapper.prototype.toRealArray= function(mapFn, mapThisObj){
	var array = [];
	this.source.some(function(item){
		array.push(item);
	});
	return array;
};
SomeWrapper.prototype.join = function(){
	return Array.prototype.join.apply(this.toRealArray(), arguments);
};
SomeWrapper.prototype.sort = function(){
	return Array.prototype.sort.apply(this.toRealArray(), arguments);
};
SomeWrapper.prototype.reverse = function(){
	return Array.prototype.reverse.apply(this.toRealArray(), arguments);
};
SomeWrapper.prototype.item = function(index){
	var result, i = 0;
	this.source.some(function(item){
		if(i == index){
			result = item;
			return true;
		}
		i++;
	});
	return result;
};


SomeWrapper.prototype.toSource = function(){
	var serializedParts = [];
	this.source.some(function(item){
		serializedParts.push(item && item.toSource());
	});
	return '[' + serializedParts.join(",") + ']';
};
SomeWrapper.prototype.toJSON = function(){
	var loadedParts = [];
	this.source.some(function(item){
		loadedParts.push(item);
	});
	return loadedParts;
};
