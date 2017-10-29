/*****************************************
* tClient - JSONP Twitter client
* 
* Author: Max Lovenheim Irwin
* Date:	 10/10/10
*
* Copyright(c) Max Lovenheim Irwin, 2010
*****************************************/

var tClient = function(){	
	var timeoutId = 0;
	var timeoutCount = 0;
	var initialized = false;
	var callbackFunction;
	var failureFunction;
	
	//Gets the public timeline JSON data from twitter api
	function getRaw(url) {
		var TIMEOUT_IN_MILLISECONDS = 30000;
		var p = (url.indexOf('?')>-1)?'&':'?';
		var script = document.createElement("script");
		script.setAttribute("src",url + p + "callback=tClient.callbackTwitter");
		script.setAttribute("type","text/javascript");                
		document.body.appendChild(script);
		timeoutId = setTimeout("tClient.callbackCancel();",TIMEOUT_IN_MILLISECONDS);
	}
			
	return {
		//Call this first!
		get:function(stream,callback,failure) {
			initialized=true;
			callbackFunction = callback;
			failureFunction = failure;
			getRaw(stream);
		},
		//Call this when you get a result
		parseTweets:function(data){
			var tweets = [];
			for(i in data) { //each tweet
				var text = data[i].text.toString();
				if (text.length) tweets.push(text);
			}
			return tweets;
		},
		//Call this when you get a result
		//Parses charcodes from text into a binary string;
		parseBinary: function(data) {
			var binary = "";
			for(i in data) { //each tweet
				var text = data[i].text.toString();
				while(text.length) { //each char
					binary += text.charCodeAt(0).toString(2);
					text = text.substring(1);
				}
			}
			return binary;	
		},
		//Call this when you get a result
		//Parses charcodes from text into binary, and back into an array of base10 integer N's with 0 <= N < max
		parseRandoms: function(data,maxRandom) {
			var binary = "";
			var randoms = [];
			var maxlength = maxRandom.toString(2).length;
			for(i in data) { //each tweet
				var text = data[i].text.toString();
				while(text.length) { //each char
					binary += text.charCodeAt(0).toString(2);
					text = text.substring(1);
					if (binary.length>=maxlength) {
						randoms.push((parseInt(binary,2)%maxRandom));
						binary = "";
					}
				}
			}
			return randoms;
		},
		//receives Twitter API JSONP
		callbackTwitter:function(data) {
			clearTimeout(timeoutId);
			callbackFunction(data);
		},
		//timeout when calling Twitter API
		callbackCancel:function() {
			timeoutCount++;
			failureFunction();
		}
	};
	
}();