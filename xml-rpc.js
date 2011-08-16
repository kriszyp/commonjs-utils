var XMLHttpRequest = require("browser/xhr").XMLHttpRequest;
exports.XmlRpc = function(target){
	return function(methodName, params){
		var xml = '<?xml version="1.0"?><methodCall><methodName>' + methodName + 
			'</methodName><params>' + 
			params.map(function(param){
				return '<param>' + valueToXml(param) + '</param>';
			}).join("") + '</params></methodCall>\n\n';
		
		var xhr = new XMLHttpRequest();
		xhr.open("POST", target, false);
		xhr.setRequestHeader("Content-Type", "application/xml");
		xhr.send(xml);
		if(xhr.status >= 300){
			throw new Error(xhr.responseText);
		}
		var xml = xhr.responseXML;
		var fault = xml.getElementsByTagName("fault").item(0);
		if(fault){
			fault = xmlToValue(fault.firstChild);
			throw new Error(fault.faultString + " code: " + fault.faultCode);
		}
		var param = xml.getElementsByTagName("param").item(0);
		return xmlToValue(param.firstChild);
	};
	function valueToXml(value){
		var valueString = "<value>";
		switch(typeof value){
			case "number" :
				if(value % 1 == 0){ 
					valueString += '<i4>' + value + '</i4>';
				}
				else{
					valueString += '<double>' + value + '</double>';
				}
				break;
			case "string" : 
				valueString += '<string>' + value + '</string>';
				break;
			case "boolean" : 
				valueString += '<boolean>' + (value ? 1 : 0) + '</boolean>';
				break;
			case "object" :
				if(value instanceof Date){ 
					// must be doing something wrong here, can't seem to get that to be handled by a server
					//valueString += '<dateTime.iso8601>' + JSON.parse(JSON.stringify(value)) + '</dateTime.iso8601>';
				}
				else if (value instanceof Array){
					valueString += '<array><data>';
					for(var i = 0; i < value.length; i++){
						valueString += valueToXml(value[i]);
					}
					valueString += '</data></array>';
				}
				else{
					valueString += '<struct>';
					for(var i in value){
						valueString += '<member><name>' + i + '</name>' + valueToXml(value[i]) + '</member>';
					}
					valueString += '</struct>';
				}
		}
		return valueString + "</value>";
	}
	function xmlToValue(node){
		var value = node.firstChild;
		if(!value){
			return value;
		}
		if(value.nodeType == 3){
			return value.nodeValue;
		}
		switch(value.tagName){
			case "string":
				return value.textContent;
			case "i4": case "int":
				return parseInt(value.textContent, 10);
			case "double":
				return parseFloat(value.textContent, 10);
			case "boolean":
				return !!parseInt(value.textContent,10);
			case "struct":
				var members = value.childNodes;
				var object = {};
				for(var i = 0; i < members.length; i++){
					var member = members.item(i);
					var name = childElementByTagName(member, "name").textContent;
					var memberValue = childElementByTagName(member, "value");
					object[name] = xmlToValue(memberValue);
				}
				return object;
			case "array":
				var members = value.firstChild.childNodes;
				var array = [];
				for(var i = 0; i < members.length; i++){
					array[i] = xmlToValue(members.item(i));
				}
				return array;
		}
	};
	function childElementByTagName(parent, tagName){
		var children = parent.childNodes;
		for(var i = 0; i < children.length; i++){
			if(children.item(i).tagName == tagName){
				return children.item(i);
			}
		}
	}
}