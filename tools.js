var edda = (function(){
	"use strict"

	var Tools = {};

	Tools.method = function(route) {
		var hasParams = false;
		if (route.params) {
			for(var i in route.params) {
				if(route.params.hasOwnProperty(i)) {
					hasParams = true;
					break;
				}
			}
		}

		var verb = 'COLLECTION';

		switch (route.name.toLowerCase()) {
			case 'get' : verb = hasParams?'ENTRY':'COLLECTION'; break;
			case 'post': verb = 'ADD'; break;
			case 'put' : verb = 'SAVE'; break;
			case 'delete': verb = 'REMOVE'; break;
			case 'entry': verb = 'ENTRY'; break;
			case 'collection': verb = 'COLLECTION'; break;
			case 'add': verb = 'ADD'; break;
			case 'save': verb = 'SAVE'; break;
			case 'remove': verb = 'REMOVE'; break;
			default: verb = 'COLLECTION'; break;
		}
		return verb;
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
} else if (typeof window!=="undefined") {
  //Browser
  window.edda = edda;
}