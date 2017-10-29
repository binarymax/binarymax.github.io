/*******************************************
*
* ScriptArmyKnife.js
*
* Copyright(c) 2011, Max Lovenheim Irwin
*
*******************************************/

SAK = (function () { return {version:0.1} })();

//*****************************************
//Object extentions:
//*****************************************

//min/max of two args
Math.min=function(a,b){return a>b?b:a}
Math.max=function(a,b){return a>b?a:b}
//-----------------------------------------
//converts 0-15 to 00-0F, Or n>15 to hex(n);
Number.prototype.toHex = function() {
	var s = this.toString(16);
	return ((s.length==1)?'0'+s:s);
}
//-----------------------------------------
Array.prototype.swap=function(a, b) { var tmp=this[a]; this[a]=this[b]; this[b]=tmp; }
//-----------------------------------------
//Statistical/Aggregator operations for Arrays:
Array.prototype.sum = function() { for(var t = 0, i = 0, l = this.length; i<l; i++) t+=this[i];  return t; }
Array.prototype.avg = function() { return this.sum()/this.length }
Array.prototype.med = function() { var a = this.sort(); return a[parseInt(a.length/2)]; }
Array.prototype.max = function() { if(!this.length) return 0; for(var m = this[0], i = 1, l = this.length; i<l; i++) { if (m < this[i]) m=this[i] } return m; }
Array.prototype.min = function() { if(!this.length) return 0; for(var m = this[0], i = 1, l = this.length; i<l; i++) { if (m > this[i]) m=this[i] } return m; }
Array.prototype.variance =   function() { if(!this.length) return 0; var avg = this.avg(); for(var i=0, e1=0, e2=0, n = this.length; i<n; i++) { e1+=Math.pow((this[i] - avg),2); e2+=(this[i]-avg) } e2 = (e2*e2)/n; return (e1-e2)/(n-1); }
Array.prototype.stdev = function() { return Math.pow(this.variance(),0.5) }

//*****************************************
//Data Structures:
//*****************************************


//Set - elements are guaranteed unique and sorted.
Set=function(){
     if (arguments.length>0) this.add(args(arguments));     
}
Set.prototype=new Array();
Set.prototype.cardinality = function() { return this.length; }
Set.prototype.add=function(o) {

     if (o instanceof Array)   { for (var i=0, j=o.length; i<j; i++) this.add(o[i]); return this}
     if (arguments.length>1) { for (var i=0, j=arguments.length; i<j; i++) this.add(arguments[i]); return this}
          
     var l = 0, u = this.length,  m;
 
     while ( l <= u ) { 
         if ( o > this[( m = Math.floor((l+u)/2) )] ) l = m+1;
         else u = ( o == this[m] ) ? -2 : m - 1;
     }

     if ( u > -2 ) this.splice(l,0,o);

     return this  

}
Set.prototype.remove = function (o) {
     if (arguments.length>1) { for (var i=0, j=arguments.length; i<j; i++) this.remove(arguments[i]); return}     
     var i = this.indexOf(o);
     if (i > -1) this.splice(i,1);
     return this;
}
Set.prototype.indexOf = function (o) {

     var l = 0, u = this.length,  m;
 
     while ( l <= u ) { 
         if ( o > this[( m = Math.floor((l+u)/2) )] ) l = m+1;
         else u = ( o == this[m] ) ? -2 : m - 1;
     }

     return (u==-2)?m:-1;     

}

//-----------------------------------------

Heap = function() {
}
Heap.prototype = new Array();

Heap.prototype.siftup = function () {

}

Heap.prototype.siftdown = function () {

}

Heap.prototype.indexOf = function() {
}


//-----------------------------------------
BTree = function() {
}

BTree.prototype = new Array();
          

//-------------------------------

//Converts function Arguments object to Array:
function args(o) { var a = []; for(var i=0, l=o.length; i<l; i++) a.push(o[i]); return a}


//*****************************************
//General Utilities:
//*****************************************

//Undo/Redo stack:
reru = function() {
 var stack = [];
 var i = -1;
 var command = function (un,re) { return { un : un, re : re } }  

return {
  go : ( function (un,re) { stack.unshift ( command (un,re) ); re(); } ) , 
  undo : function () { if ( i < ( stack.length -1 ) ) { stack[++i] .un (); } } ,  
  redo : function () { if ( i <= stack.length && i > -1) { stack[i--].re(); } } 
} }();

//Quick Sort:
function partition(array, begin, end, pivot, test)
{
	var piv=array[pivot];
	array.swap(pivot, end-1);
	var store=begin;
	var ix;
	for(ix=begin; ix<end-1; ++ix) {
		if(test(array[ix],piv)) {
			array.swap(store, ix);
			++store;
		}
	}
	array.swap(end-1, store);

	return store;
}

function qsort(array, begin, end, test)
{
	if(end-1>begin) {
		var pivot=begin+Math.floor(Math.random()*(end-begin));

		pivot=partition(array, begin, end, pivot, test);

		qsort(array, begin, pivot, test);
		qsort(array, pivot+1, end, test);
	}
}

//Deep Copys an Object:
function Copy(p,c) {
var c = c||{};
for (var i in p) {
  if (typeof p[i] === 'object') {
    c[i] = (p[i].constructor === Array)?[]:{};
    Clone(p[i],c[i]);
  } else c[i] = p[i];}
return c;
}


//*****************************************
//Debugging and Performance Utilities:
//*****************************************

//Timer:
T=function(){var a=[];return{go:function(n){a.unshift({n:n,t:new Date()})},s:function(){l=a.shift();return((new Date()-l.t)+'ms|'+l.n)}}}()

//-------------------------------

//Log to browser window:
function log() {

    if (!arguments.length) return;    
    for (var i = 1, l = arguments.length, s=arguments[0]; i<l; i++) s+= arguments[i].toString();
    document.querySelector('div#test').innerHTML += '<br />' + s;

}
