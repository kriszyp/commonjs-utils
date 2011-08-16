/**
 * Module for interacting with a WebWorker through JSON-RPC. 
 * You can make a module accessible through JSON-RPC as easily as:
 * some-module.js:
 * require("./json-rpc-worker").server(exports);
 *
 * And to create this worker and fire it off:
 * var Worker = require("worker"),
 *     client = require("./json-rpc-worker").client;
 * var workerInterface = client(new Worker("some-module"));
 * workerInterface.call("foo", [1, 3]).then(function(result){
 * 	... do something with the result ...
 * });
 * 
 */
var observe = require("./observe").observe,
	defer = require("./promise").defer;
// Takes a JSGI 0.3 app.
// Messages are communicated between workers using the JSGI 0.3 object structure
// serialized in JSON format. 
exports.server = function(app){
	if (global.onmessage) // dedicated worker
		observe(global, "onmessage", handleMessage);
	else // shared worker
		observe(global, "onconnect", function (e) { observe(e.port, "onmessage", handleMessage); });
	
	function handleMessage(event){
		var request = event.data;
		if(request.method){
			var response = app(request);
			response.url = request.url;
			postMessage(response);
		}
	}
};

var nextId = 1;
exports.client = function(worker){
	if(worker.port){
		worker = worker.port;
	}
	var requestsWaiting = {};
	observe(worker, "onmessage", function(event){
		var data = event.data;
		if(requestsWaiting[data.id]){
			if(data.error === null){
				requestsWaiting[data.id].resolve(data.result);
			}
			else{
				requestsWaiting[data.id].reject(data.error);
			}
			delete requestsWaiting[data.id];
		}
	});
	return function(object){
		var id = nextId++;
		object.id = id;
		worker.postMessage(object);
		var deferred = defer();
		requestsWaiting[id] = deferred;
		return deferred.promise;
	};
};

exports.rpcClient = function(worker){
	var client = exports.client(worker);
	return function(method, params){
		return client({
			method: method,
			params: params
		});
	}
}
/*
exports.JSFile = function(filename){
	var worker = new SharedWorker("store/js-file-worker", filename);
	worker.port.postMessage({start: filename});
	var promises = [];
	worker.port.onmessage = function(response){
		for(var i = 0;i < promises;){
			var promise = promises[i];
			if(promise.url == response.url){
				promise.resolve(response);
				promises.splice(i,1);
			}
		}
	}
	jsgiWorker = function(request){
		print("request " + request.toSource());
		worker.port.postMessage(request);
		var promise = new Promise();
		promise.url = request.url;
		promises.push(promise);
		var response;
		promise.then(function(value){
			response = value;
		});
		// return synchronously
		wait(promise);
		return response;
	};*/