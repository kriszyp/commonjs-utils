/**
* A pubsub hub for distributing messages. Supports delegation to other workers and servers
**/
var hub = [];
try{
	var defer = require("promise").defer,
		enqueue = require("event-loop").enqueue;
}catch(e){
	if(!defer){
		defer = function(){return {resolve:function(){}}};
	}
	enqueue = function(func){func()};
}
exports.publish= function(channel, message){
	if(arguments.length === 1){
		channel = channel.channel;
		message = channel;
	}
/*			channel = normalizeChannel(channel);
			var hubs = [hub];
			for(var i = 0; i < channel.length && hubs.length > 0; i++){
				var nextHubs = [];
				for(var j = 0; < hubs.length; j++){
					var thisHub = hubs[j];
					if(thisHub.channels){
						var nextHub = thisHub.channels[channel[i]];
						if(nextHub){
							nextHubs.push(nextHub);
						}
						var nextHub = thisHub.channels["*"];
						if(nextHub){
							nextHubs.push(nextHub);
						}
					}
				}
				hubs = nextHubs;
			}*/
	var responses = [];
/*			for(var j = 0; < hubs.length; j++){
				var thisHub = hubs[j];
				for(var i =0; i< thisHub.length;i++){
					var subscriber = thisHub[i];
					if(!clientId || clientId != subscriber.id){
						responses.push(subscriber(message));
					}
				}
			}*/
	var eventName = message.event;
	var clientId = message.clientId;
	notifyAll(channel);
	channel = channel.replace(/\/[^\/]$/,'');
	notifyAll(channel + "/*");
	while(channel){
		channel = channel.replace(/\/[^\/]$/,'');
		notifyAll(channel + "/**");
	}
	function notifyAll(subscribers){
		var subscribers = hub[channel];
		if(subscribers){
			if(eventName){
				subscribers = subscribers[eventName];
				if(!subscribers){
					return;
				}
			}
			subscribers.forEach(function(subscriber){
				if(!clientId || clientId != subscriber.id){
					var deferred = defer();
					responses.push(deferred.promise);					
					enqueue(function(){
						deferred.resolve(subscriber(message));
					});
				}
			});
		}
	}
	return responses; 
};
		
exports.subscribe= function(channel, /*String?*/eventName, listener){
	channel = normalizeChannel(channel);
	var newChannel = false;
	if(typeof eventName === "function"){
		listener = eventName;
		eventName = null;
	}
	var subscribers = hub[channel];
	if(!subscribers){
		subscribers = hub[channel] = [];
		newChannel = true;
	}
	/*for(var i = 0; i < channel.length && hubs.length > 0; i++){
		var channels = subscribers.channels;
		if(!channels){
			subscribers.channels = {};
		}
		subscribers = channels
	}*/
	
	if(eventName && eventName != "*"){
		subscribers = subscribers[eventName];
		if(!subscribers){
			 subscribers = subscribers[eventName] = [];
			 newChannel = true;
		} 
	}
	if(newChannel){
		var responses = exports.publish(channel, {channel:channel, clientId: listener.id, event: "monitored", monitored: true, forEvent: eventName});
	}else{
		var responses = [];
	}
	subscribers.push(listener);
/*	// At some point we may publish these to the target channel with a special subscription message 
	var responses = all(exports.routes[source].map(function(destination){
		return destination.subscribe(channel, function(channel, message){
			publish(destination.name, channel, message);
		});
	}));*/
	responses.unsubscribe = function(){
			publish(source, channel, {}, "unsubscribe");
			subscribers.splice(subscribers.indexOf(listener), 1);
		};
	return responses;
};

exports.unsubscribe= function(channel, listener){
	exports.publish({pathInfo:channel}, "unsubscribe");
	subscribers.splice(subscribers.indexOf(listener), 1);
};

exports.getChildHub = function(channel){
	return {
		publish: addPath(exports.publish),
		subscribe: addPath(exports.subscribe),
		unsubscribe: addPath(exports.unsubscribe),
		getChildHub: addPath(exports.getChildHub)
	};
	function addPath(func){
		return function(subChannel){
			arguments[0] = channel + '/' + subChannel;
			return func.apply(this, arguments);
		}
	}
}
	function normalizeChannel(channel){
		return typeof channel == "string" ? channel.split("/") : channel;
	}

 

