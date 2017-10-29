/***********************************
*
* Naive Data Cubing Algorithm
* Computes a multidimensional data cube core
*
* Author: Max Lovenheim Irwin
* Date: 20/5/2011
*
*
***********************************/

var ALL = "[*]";

function Cube(a) {

	if (!(a instanceof Array) || (!a.length)) return null;

	var n = a[0].length-1;
	var cardinality = Math.pow(2,n);
	var sortmap = [];
	
	//root node:
	var cube = new CubeNode('root');
	console.log(cube);
	cube.order = -1;

	//Initialize dimensional and binary lookup data:
	for(var z="",zi=0;zi<n;zi++)z+="0";
	for(var i=0;i<cardinality;i++) {
		var b = getBinary(i,z);
		for(var j=0,k=0;j<n;j++) if (b[j]==1) k++;
		sortmap.push({order:k,binary:b,integer:i});
	}
	sortmap.sort(function(a,b){return a.order-b.order});
		
	var Powerset = function (a,n,cube,sortmap) {
		
		var p=[], 	//Powerset array
			m=null, //Sortmap item cache
			b="";	//Binary cache
		
		//Build powerset:
		for(var i=0,l=sortmap.length;i<l;i++) {
			
			m=sortmap[i];	//dimensional data
			b=m.binary;		//binary shortcut
			p[i]=[];		//subset in powerset
			
			//only add items to subset corresponding to binary:
			for(var j=0;j<n;j++) if (b[j]==1) p[i].push(a[j]);
						
			//find/add the node to the tree
			var node = cube.Find(getHash(p[i]));
			if (!node) {
				if (p[i].length == 1) {
					node = cube.AddChild(p[i]);
				} else {
					node = new CubeNode(p[i]);
					
					//Traverse tree to add node to cube index
					cube.Traverse(function(pnode) {
					
						//Only check in against the node one order up
						if (pnode.order==node.order-1) {
						
							//Already a child?
							if (!pnode.hasChild(node.hash)) {
							
								//Subset of node we are checking?
								if (isSubset(node.item,pnode.item)) {
									
									node.dimension = pnode.dimension+1;
									pnode.children.push(node);
									
								}
							}
							
						}
						
					});
					
				}
				
			}
			
			//Add index:
			if (p[i].length==n) node.values.push(a[n]);

		}
	}
	
	for(var i=0,l=a.length;i<l;i++) Powerset(a[i],n,cube,sortmap);
	return cube;
	
}

//Cube tree/node structure
function CubeNode(o) {
	if (o instanceof Array) {
		this.root = false;
		this.item = o;
		this.order = o.length;
		this.dimension = 0;
		this.hash = getHash(o);
	} else {
		this.root = true;
		this.item = o;
		this.order = -1;
		this.dimension = -1;
		this.hash = o;
	}
	this.values = [];
	this.children = [];
}
CubeNode.prototype.AddChild = function(o) {
	var cn = (o instanceof CubeNode) ? o : new CubeNode(o);
	cn.dimension = this.dimension+1;
	this.children.push(cn);
	return cn;
}
CubeNode.prototype.Traverse = function(callback) {
	callback(this);
	for(var i=0,l=this.children.length;i<l;i++) this.children[i].Traverse(callback);
}
CubeNode.prototype.Find = function(h) {
	if (this.hash === h) return this;
	for(var i=0,l=this.children.length,found=false;i<l;i++) {
		var f = this.children[i].Find(h);
		if (f!=null) return f;
	}
	return null;
}
CubeNode.prototype.hasChild = function(h) {
	for(var i=0,l=this.children.length,found=false;i<l;i++) {
		if (this.children[i].hash==h) { found=true; i=l; }
	}
	return found;
}


//Utility Methods
function getHash(o) { return o.join('|'); }
function getBinary(i,z) { var b = i.toString(2); return z.substr(0,z.length - b.length)+b; }
function isSubset(a,b) { 
	var i=0,j=0,al=a.length,bl=b.length;
	while(i<al && j<bl) if(a[i++]==b[j]) j++;
	return j==bl;
}
