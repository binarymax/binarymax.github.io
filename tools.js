var edda = (function(){
	"use strict"

	var Tools = {};

	Tools.exists = function(obj) {
		if(!_.isObject(obj)) return false;

		for(var key in obj) {
			if(obj.hasOwnProperty(key) && _.isObject(obj[key])) {
				return true;
			}
		}

		return false;
	};

	Tools.resources = function(api,callback) {
		if(_.isArray(api)) {
			var comma = false;
			for (var i=0;i<api.length;i++) {
				callback(api[i],api[i].name,(comma)?',':'');
				comma = true;
			}
		}
	};

	Tools.methods = function(resource,callback) {
		if(_.isArray(resource.methods)) {
			var comma = false;
			var methods = resource.methods;
			for (var i=0;i<methods.length;i++) {
				callback(methods[i],methods[i].name,(comma)?',':'');
				comma = true;
			}
		}
	};

	Tools.controllers = function(api,callback) {
		if(_.isArray(api)) {
			var controllers = api.controllers = {};
			var controllerhash = api.controllerhash = {};
			for(var i=0;i<api.length;i++) {
				var resource = api[i]; 
				if (resource.methods) for(var j=0;j<resource.methods.length;j++) {
					var method = resource.methods[j];
					if (method.command) {
						var command  = method.command.split('#');
						if (command.length) {
							var controller = controllers[command[0]] = controllers[command[0]] || {path:command[0],name:resource.name,methods:[],count:0};
							var controllermethod = {name:resource.name,location:command[0],method:command[1]};
							controller.methods.push(controllermethod);
							controllerhash[method.command] = controllermethod;
							controller.count++;
						}
					}
				}
			}
			var num = 0;
			for(var c in controllers) {
				if(controllers.hasOwnProperty(c)) {
					var controller = controllers[c];
					callback(controller.name,controller.path);
				}
			}
		}
	};

	Tools.command = function(api,command,controller) {
		var ch;
		if(api.controllerhash && (ch=api.controllerhash[command])) {
			return ch.name+controller+ch.method;
		}
		return null;
	};

	Tools.method = function(route) {

		var verb = 'COLLECTION';
		if (route && route.name) {
			switch (route.name.toLowerCase()) {
				case 'post': verb = 'ADD'; break;
				case 'put' : verb = 'SAVE'; break;
				case 'delete': verb = 'REMOVE'; break;
				case 'entry': verb = 'ENTRY'; break;
				case 'collection': verb = 'COLLECTION'; break;
				case 'add': verb = 'ADD'; break;
				case 'save': verb = 'SAVE'; break;
				case 'remove': verb = 'REMOVE'; break;
				case 'get' : verb = Tools.exists(route.params)?'ENTRY':'COLLECTION'; break;
				default: verb = 'COLLECTION'; break;
			}
		}
		return verb;
	};

	Tools.response = function(response,callback) {
		_.each(response,function(field,key) {
			//console.log(field);
			if(field.type==='object' && field.response) {

				callback(field,key);
				Tools.response(field.response,callback);

			} else if (field.type==='array' && field.response) {

				callback(field,key);
				Tools.response(field.response,callback);

			} else {

				callback(field,key);

			}

		});
	};

	Tools.route = function(resource,route) {
		var str = '/' + resource + '/';
		if (route && route.params) {
			for(var param in route.params) {
				str+=':'+param+'/';
			}
		}
		return str;
	};

	Tools.repeat = function(char,length) {
		var str = "";
		while(length--) str += char;
		return str;
	};

	Tools.mock = function(resource,route) {
		var str = '/' + resource + '/';
		if (route && route.params) {
			for(var param in route.params) {
				str+=fake(route.params[param]) + '/';
			}
		}
		return str;	
	};

	var fake = function(param) {
		var val = '';
		switch (param.type) {
			case 'int64': val=1; break;
			default: val = 'hi'; break;
		}
		return val;
	};

	return Tools;
})();

if(typeof module !== "undefined" && module.exports) {
  //Node
  module.exports = edda;
  var _ = require('underscore');
} else if (typeof window!=="undefined") {
  //Browser
  window.edda = edda;
}