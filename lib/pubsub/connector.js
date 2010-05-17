/**
* A connector to other pubsub hubs
**/
var hub = require("./hub");
exports.Connector = function(obj){
	onSubscription.id = obj.clientId;
	hub.subscribe("**", "monitored", onSubscription);
	return function(message){
		message.clientId = onSubscription.id; 
		hub.publish(message);
	}
	function onSubscription(message){
		if(message.monitored){
			obj.subscribe(message.channel, message.forEvent);
		}else{
			obj.unsubscribe(message.channel);
		}
	}
};

function GenericConnector(clientId, connection){
	var connector = exports.Connector({
		clientId: clientId,
		subscribe: function(channel, event, listener){
			connection.send({
				method: "subscribe",
				pathInfo: channel,
				subscribe: event || "*"
			});
		},
	});
	connection.onmessage = function(message){
		connector(message);
	}
}
exports.WorkerConnector = function(workerName){
	worker = new SharedWorker(workerName);
	worker.onmessage = function(event){
		connection.onmessage(event.data);
	}
	var connection = {
		send: function(data){
			worker.postMessage(data);
		}
	};
	GenericConnector("local-workers", connection);
}
exports.HttpConnector = function(url){
	
}
onmessage = function(event){	
	var request = JSON.parse(event.data);
	var source = event.ports[0];
	var sourceName = source.name;
	var topic = request.pathInfo;
	switch(request.method.toLowerCase()){
		case "post":
			publish(sourceName, topic, request.body);
			break;
				
		case "subscribe":
			subscribe(sourceName, topic, function(){
				source.postMessage();
			});
			break;
			
		case "unsubscribe":
			unsubscribe(sourceName, topic);
	}
	
}
