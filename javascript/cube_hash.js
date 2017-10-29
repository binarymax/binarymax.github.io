/***********************************
*
* Naive Data Cubing Algorithm
* Computes a multidimensional data cube core
* NOTE: Does not use a tree for super-aggregates.
*
* Author: Max Lovenheim Irwin
* Date: 17/5/2011
*
*
***********************************/

function HashCube(a,aggregator) {

	if (!(a instanceof Array) || (!a.length)) return null;
	
	var ALL = "[*]";
	var hash = new Array();
	var cube = [];
	var n = a[0].length-1;
	var cardinality = Math.pow(2,n);

	var sortmap = [];
	for(var z="",zi=0;zi<n;zi++)z+="0";
	for(var i=0;i<cardinality;i++) {
		var b = getBinary(i,z);
		for(var j=0,k=0;j<n;j++) if (b[j]==1) k++;
		sortmap.push({order:k,binary:b,integer:i});
	}
	sortmap.sort(function(a,b){return a.order-b.order});

	
	var Powerset = function (a,n,c,s,sortmap,aggregator) {
		var p=[], b="", j=0, k=-1, m=null, an=a[n];
		for(var i=0,sl=sortmap.length;i<sl;i++) {
			m=sortmap[i];
			b=m.binary;
			p[i]=[];
			for(j=0;j<n;j++) p[i].push((b[j]==1) ? a[j] : ALL);
			
			var h = getHash(p[i]);
			if (!s[h]) {
				c.push({values:p[i],hash:i,order:m.order,aggregate:an,count:1,index:[a[n]]});
				s[h]=c.length;
			} else {
				//c[s[h]-1].aggregate = aggregator(c[s[h]-1].aggregate,a[n]);
				c[s[h]-1].index.push(a[n]);
				c[s[h]-1].aggregate+=an;
				c[s[h]-1].count++;
			}
		}
	}
	
	for(var i=0,l=a.length;i<l;i++) Powerset(a[i],n,cube,hash,sortmap,aggregator);
	return cube.sort(function(a,b){ return (b.order!=a.order) ? b.order-a.order : (b.hash!=a.hash) ? b.hash-a.hash : (b.values.join(',')<a.values.join(',')?1:-1 ) });
	
}

function getHash(o) { return o.join('|'); }
function getBinary(i,z) { var b = i.toString(2); return z.substr(0,z.length - b.length)+b; }
