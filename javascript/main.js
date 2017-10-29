var TWITTER_BINARYMAX_TIMELINE = "http://api.twitter.com/1/statuses/user_timeline.json?screen_name=binarymax";
var TWITTER_PUBLIC_TIMELINE = "http://api.twitter.com/statuses/public_timeline.json";
var messageCount=0;
function LogToUI(message,newline) {
	if (newline) {
		messageCount++;
		document.getElementById('footer').style.top = (700 - messageCount*13).toString() + "px"; //13 is a magic number!
		document.getElementById('footer').innerHTML += "<br />"
	}
	document.getElementById('footer').innerHTML += message;
}