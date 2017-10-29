/*********************************************
*
* ActiveGrid - HTML5 Pivot Table tool
*
* Author: Max Lovenheim Irwin
* Version: 0.1
* Date: 9/11/2010;
*
*********************************************/

//DataSource Types enum:
var EDataSourceTypes = {table:0,json:1,xml:2};

//Data Type enum:
var EDataTypes = {Text:0,Int:1,Float:2};

//Aggregator enum:
var EAggregators = ["Sum","Avg","Val","Min","Max","Med","Var","Dev","Reg"];

var ItemTemplate = {"name":"","datatype":-1,"isrow":0,"iscolumn":0,"isdata":0,"data":[]};

//Pivot object:
var Pivot = {
	id:"",
	sets:[],
	groups:[],
	items:[],					//The pivotable collection of items
	rows:[],
	cols:[],
	data:[],
	rowsdistinct:[],
	colsdistinct:[],
	datasourcetype:{},	//the datasource type (html table, JSON, XML, etc)
	datasource:{}, 		//The source object
	/***********************************/
	init:function(id){

		//Set the id and datasource
		s = this.datasource = document.getElementById(this.id = id);
						
		//Get the items from the data source:
		if (s.rows) {

			for(c=0;c<s.rows[0].cells.length;c++) {
				//Name:
				k = Clone(ItemTemplate);
				k.name = s.rows[0].cells[c].innerText;
				
				//Add the data	and type-ify
				for(r=1;r<s.rows.length;r++) {
					v = s.rows[r].cells[c].innerText; 
					if (k.datatype==EDataTypes.Text) {
						k.datatype = EDataTypes.Text;
						d = v;
					} else if (k.datatype==EDataTypes.Int) {
						if (!isNaN(d = parseInt(v))) {
							k.datatype = EDataTypes.Int;
						} else {
							d=v;
						}
					} else {
						if (!isNaN(d = parseFloat(v))) {
							k.datatype = EDataTypes.Float;
						}
						else if (!isNaN(d = parseInt(v))) {
							k.datatype = EDataTypes.Int;
						}
						else {
							k.datatype = EDataTypes.Text;
							d = v;
						}
					}					
					k.data.push(d);
				}
								
				k.isrow = 0;
				k.iscolumn = 0;
				k.isdata = 0;
								
				//Add the item:
				this.items.push(k);
				
			}
		}
		
	},
	/***********************************/
	Calculate:function(iAggregator){
				
		/* TABLE A (Source):
				|Region	Gender	Style		Units	Price	 Color
				|-----------------------------------------------
			0	|East		Male		Shirt		2		10		 Red
			1	|East		Male		Short		3		20		 Blue
			2	|East		Female	Shirt		4		10		 Red
			3	|West		Female	Short		5		20		 Blue
			4	|West		Male		Shirt		9		10		 Red
			5	|West		Male		Short		6		20		 Blue
			6	|West		Female	Shirt		1		10		 Red
			7	|West		Female	Short		7		20		 Blue
			8	|East		Male		Pants		2		17		 Red
			9	|East		Female	Pants		17		17		 Red
			10	|West		Female	Pants		52		19		 Red
			11	|West		Male		Pants		41		11		 Blue
			12	|West		Female	Pants		5		19		 Red
		*/														     
		
		/* TABLE B (Result):
		
				<SUM>	   |STYLE|Shirt 	|Short	|Pants  |
						   |COLOR|Red|Blue|Red|Blue|Red|Blue|
		 REGION|GENDER |-----|--------|--------|--------|-------	
		-------------------------|--------|--------|------------
			West|Male	|-----|   |    |   |    |   |    |       
			    -------------------------------------------------
				 |Female	------| X |    |   |    |   |    |       
			-----------------------------------------------------
			East|Male	|-----|   |    |   |    |   |    |       
			    -------------------------------------------------
				 |Female	------|   |    |   |    |   |    |       
			-----------------------------------------------------
		
		
		//We could loop through entire table every time its calculated, but that is slow
		//so we store in cubes.  but how do the cubes work?

		//1) For Shirt,Red,West,Female (the X in the grid) we store the list of matching index positions from table A:
		//	--> [Shirt,Red]=[0,2,4,6,12]
		// --> [Red,West]=[4,6,10,12]
		// --> [West,Female]=[3,7,10,12]
				
		*/
		
		rows = this.rows = this.Rows();
		cols = this.cols = this.Columns();
		data = this.data = this.Data();
						
		if ((this.items.length) && (this.rows.length) && (this.cols.length) && (this.data.length)) {

			// (1)

			//The associative array of cubes:
			a = new Array();

			//For each source table column classified as an OLAP column
			for(var x=0,xl=cols.length;x<xl;x++) { 

				this.colsdistinct[x] = [];

				//For each source table column classified as an OLAP row
				for(var y=0,yl=rows.length;y<yl;y++) {
				
					this.rowsdistinct[y] = [];

					//For each source table row:
					for(var z=0,zl=rows[y].length;z<zl;z++) { //Remember, rows[y].length==cols[x].length! So we only need one loop:

						//If the cube does not exist, create the first and second
						//dimensions, hashed in 'a', using JS associative arrays
						if (!a[cols[x][z]]) a[cols[x][z]] = new Array();

						//If the third cube dimension does not exist, create it:
						if (!a[cols[x][z]][rows[y][z]]) { 
							a[cols[x][z]][rows[y][z]] = new Array(); 
							this.sets.push({"col":cols[x][z],"row":rows[y][z]}); //Push the index
						}

						//Add sorted distinct:
						this.colsdistinct[x].placeDistinct(cols[x][z]);
						this.rowsdistinct[y].placeDistinct(rows[y][z]);

						//Push the source table row index to the cube:
						a[cols[x][z]][rows[y][z]].push(z);

					} //z

				} //y

			} //x		
		
		} //length check
		

		//2) We then Sort the sets and build the table
		if (this.sets.length>0) {
			
			//Sort by the columns:
			//qsort(this.sets, 0, this.sets.length, function(A,B) { return (A.col<=B.col); });
			//qsort(this.sets, 0, this.sets.length, function(A,B) { return (A.row<=B.row); });
			
			//Sort by the number of distinct items (the lesser items on the outer edge)
			qsort(this.colsdistinct, 0, this.colsdistinct.length, function(A,B) { return (A.length<=B.length); });
			qsort(this.rowsdistinct, 0, this.rowsdistinct.length, function(A,B) { return (A.length<=B.length); });

			var t = String.format("<table>"), h="", b="";

			//colspan for column headers:
			var cds = this.colsdistinct[0].length * (((cdsl = this.colsdistinct.length)==1)?1:this.colsdistinct[cdsl-1].length);
			var rds = ((cdsl = this.rowsdistinct.length)==1)?this.rowsdistinct[0].length:this.rowsdistinct[cdsl-1].length;

			//Each column
			for(var cd=0,cdl=this.colsdistinct.length;cd<cdl;cd++) {
				
				h += String.format("<tr><td colspan='{0}'>&nbsp;</td>",this.rows.length);
				
				//Each column value
				for (var cdx=0,cdxl=this.colsdistinct[cd].length;cdx<cdxl;cdx++) {
				
					h += String.format("<td>{0}</td>",this.colsdistinct[cd][cdx]);	

				}
				
				h += "</tr>";
				
			}

			//Each row
			for(var rd=0,rdl=this.rowsdistinct.length;rd<rdl;rd++) {

				b += "<tr>";

				//Each row value
				for (var rdx=0,rdxl=this.rowsdistinct[rd].length;rdx<rdxl;rdx++) {
					//a[][]
					b += String.format("<td>{0}</td>",this.rowsdistinct[rd][rdx])
				}

				b += String.format("<td colspan='{0}'>&nbsp;</td></tr>",cds);

			}


			t += (h + b + "</table>");

			document.body.innerHTML += '<div style="float:right">' + t + '</div>';
		
			/*
			//debug
			var c = new Array();
			for(var s=0,sl=this.sets.length;s<sl;s++){
				c.push(this.sets[s].col + ',' + this.sets[s].row + ':' + JSON.stringify(a[this.sets[s].col][this.sets[s].row]));
			}
			document.body.innerHTML += '<div style="float:right">' + (c.join('<br />')) + '</div>';
			*/			
			/*
			var t = String.format("<table><tr><td colspan='{0}'>&nbsp;</td>",this.rows.length);
			var u = "<tr>";
			var l = "";
			for(var r=0,rl=this.rows.length;r<rl;r++) u+="<td>{"+r+"}</td>";
			for(var s=0,sl=this.sets.length;s<sl;s++){
				//c.push(this.sets[s].col + ',' + this.sets[s].row + ':' + JSON.stringify(a[this.sets[s].col][this.sets[s].row]));
				if (this.sets[s].col!=l) {
					t += String.format("<td>{0}</td>",l=this.sets[s].col);
					u += "<td>{"+(r++)+"}</td>";
				}
				
			}
			u += "</tr>";
			t += "</tr>" + u + "</table>";
			
			alert(t);
			document.body.innerHTML += '<div style="float:right">' + t + '</div>';
			*/



		}
				
		//3) We then Sort and intersect the data, finding the common points for the item in grid: X:
		// --> (([Shirt,Red] INTERSECT [Red,West]) INTERSECT [West,Female]) = [d[10],d[12]]
		// --> If our data to aggregate is the table column "Units", that gives us [52,5]
		// --> If the aggregate function is SUM, that gives us 57
		
		/*
		if ((this.items.length) && (this.rows.length) && (this.cols.length) && (this.data.length)) {

			//BUILD!
			for(ri=0;ri<this.rows.length;ri++) {
				for(ci=0;ci<this.cols.length;ci++) {

					r = this.items[this.rows[ri]].data;  //ONLY ONE ROW ALLOWED NOW!
					c = this.items[this.cols[ci]].data;  //ONLY ONE COLUMN ALLOWED NOW!
					d = this.items[this.data[0]].data;	 //ONLY ONE DATA ITEM ALLOWED NOW!

					//BUILD ARRAY
					cd = this.colsdistinct = c.distinct();
					rd = this.rowsdistinct = r.distinct();
					a = this.groups = new Array(cd.length);
					for(x=0;x<c.length;x++) {
						if (!a[c[x]]) a[c[x]] = new Array(rd.length); //INIT COLUMN
						for(y=0;y<r.length;y++) {
							if (!a[c[x]][r[y]]) a[c[x]][r[y]]={sum:0,data:[]}; //INIT ROW
						}
					}

					//AGGREGATE!!!
					for(z=0;z<d.length;z++)
					{
						a[c[z]][r[z]].sum+=d[z];
						a[c[z]][r[z]].data.push(d[z]);
					}

					//DISPLAY!
					tx = ty = op = sel = "";
					for (i=0;i<EAggregators.length;i++) {
						sel = (i==iAggregator)?" selected":"";
						op+="<option value=\""+i+"\""+sel+">"+EAggregators[i]+"</option>";
					}
					t = document.createElement("TABLE");
					t.setAttribute("style","border:1px solid black;");
					th = document.createElement("TR");
					td = document.createElement("TD");
					td.innerHTML = "<select onchange=\"Pivot.Calculate(this.selectedIndex);\">"+op+"</select>";
					th.appendChild(td);

					for(y=0;y<rd.length;y++)
					{
						//if row value is new then create the value column
						tr = document.createElement("TR");
						td = document.createElement("TD");
						td.innerText = rd[y];
						tr.appendChild(td);

						for(x=0;x<cd.length;x++)
						{
							if(y==0) {
								td = document.createElement("TD");
								td.innerText = cd[x];
								th.appendChild(td);
							}
							//if row value is new then create the value column
							td = document.createElement("TD");
							td.innerText = this.Aggregate(a[cd[x]][rd[y]].data);
							td.setAttribute("style","border:1px solid black;");
							tr.appendChild(td);
						}
						if(y==0) t.appendChild(th);
						t.appendChild(tr);

					}

					document.getElementById('results').innerHTML = "";
					document.getElementById('results').appendChild(t);
					//this.datasource.style.display="none";
					
				}
				
			}
			
		}*/
		
	},
	Display:function(iAggregator) {
	
		if (!iAggregator) { 
			iAggregator = 0;
			this.Aggregate = this.Sum; 
		} else {
			this.SetAggregate(iAggregator);
		}
	
		for (x=0;x<cols.length;x++) {
			
			dimX = cols[x].distinct();
			
			for (y=0;y<rows.length;y++) {
			
				dimY = rows[y].distinct();
				
				
			
			}
		
		}
		
	
	},

	/***********************************/
	Aggregate:function(){}, //The delegate calculation function
	Count:function(Data){ if (!Data.length) return null; return Data.length; },
	Val:function(Data){ if (!Data.length) return null; return Data.join(','); },
	Sum:function(Data){ if (!Data.length) return null; v=0; for(i=0;i<Data.length;i++) {v+=Data[i];} return v; },
	Avg:function(Data){ if (!Data.length) return null; v=0; for(i=0;i<Data.length;i++) {v+=Data[i];} return (Data.length)?v/Data.length:0; },
	Min:function(Data){ if (!Data.length) return null; v=Data[0]; for(i=1;i<Data.length;i++) {v=(Data[i]<v)?Data[i]:v;} return v; },
	Max:function(Data){ if (!Data.length) return null; v=Data[0]; for(i=1;i<Data.length;i++) {v=(Data[i]>v)?Data[i]:v;} return v; },
	Med:function(Data){ if (!Data.length) return null; Data=Data.sort(); v=(Data.Length%2==0)?Data[Data.length/2]:Data[(Data.length-1)/2]},
	
	//TODO: Proprietary:
	Dev:function(Data){ return "not implemented"; }, //Standard Deviation
	Var:function(Data){ return "not implemented"; }, //Variance
	Reg:function(Data){ return "not implemented"; }, //Linear Regression
	//Rn:function(Data){},  	//Multivariate Regression
	
	Rows:function(){
		a = [];
		for(i=0;i<this.items.length;i++){
			if (this.items[i].isrow) a.push(this.items[i].data);
		}
		return a;
	},
	
	Columns:function(){
		a = [];
		for(i=0;i<this.items.length;i++){
			if (this.items[i].iscolumn) a.push(this.items[i].data);
		}
		return a;
	},

	Data:function(){
		a = [];
		for(i=0;i<this.items.length;i++){
			if (this.items[i].isdata) a.push(this.items[i].data);
		}
		return a;
	},

	/***********************************/
	/**Converts a Item into a Pivot Column**/
	ToColumn:function(item){
		i = this.GetItem(item);
		i.iscolumn=1;		
		i.isrow=0; 	//cannot be both a column and a row
		i.isdata=0;  //cannot be both a column and a data element
		
		//Calculate the grid
		this.Calculate();
		
	},
	
	/**Checks if a item is already a Pivot Column**/
	IsColumn:function(item){
		return this.GetItem(item).iscolumn;
	},
	
	/***********************************/
	/**Converts a Item into a Pivot Row**/
	ToRow:function(item){
		i = this.GetItem(item);
		i.isrow=1;
		i.iscolumn=0; //cannot be both a row and a column
		i.isdata=0;   //cannot be both a row and a data element
		
		//Calculate the grid
		this.Calculate();	
	},
	
	/**Checks if a item is already a Pivot Row**/
	IsRow:function(item){
		return this.GetItem(item).isrow;
	},

	/***********************************/
	ToData:function(item){
		//Get the index of the item:
		i = this.GetItem(item);
		
		i.isdata=1;
		i.iscolumn=0; //cannot be both a data element and a column
		i.isrow=0;    //cannot be both a data element and a row

		//Calculate the grid
		this.Calculate();		
	},
	IsData:function(item){
			return this.GetItem(item).isdata;
	},

	/***********************************/
	//Helper function to get the item by index or by object
	GetItem:function(item) {
		i = (!isNaN(parseInt(item))) ? this.items[item]:item;
		return i;
	},

	SetAggregate:function(i) {
		switch (EAggregators[i]) {
			case "Sum": this.Aggregate = this.Sum; break;
			case "Val": this.Aggregate = this.Val; break;
			case "Avg": this.Aggregate = this.Avg; break;
			case "Min": this.Aggregate = this.Min; break;
			case "Max": this.Aggregate = this.Max; break;
			case "Med": this.Aggregate = this.Med; break;
			case "Var": this.Aggregate = this.Var; break;
			case "Dev": this.Aggregate = this.Dev; break;
			case "Reg": this.Aggregate = this.Reg; break;
		}
	}
	
};

// Array dedup
Array.prototype.distinct = function() {
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==this[i])
			{
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
};

//Array intersect
Array.prototype.intersect = function (b) {
  var ai=0, bi=0, al=this.length, bl=b.length;
  var result = new Array();
  while( ai<al && bi<bl )
  {
     if      (this[ai] < b[bi] ){ ai++; }
     else if (this[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(this[ai]);
       ai++;
       bi++;
     }
  }
  return result;
}


//QUICKSORT - adapted from http://en.literateprograms.org/Quicksort_(JavaScript)
//swap for quicksort
Array.prototype.swap=function(a, b)
{
	var tmp=this[a];
	this[a]=this[b];
	this[b]=tmp;
}


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

function quick_sort(array)
{
	qsort(array, 0, array.length, function(A,B) { return (A.col<=B.col); });
}


Array.prototype.placeDistinct = function(n) {
	var i = this.placementForSorted(n);
	if (i>-1) this.splice(i,0,n);
}

Array.prototype.place = function(n) {
	this.splice(this.placementForSorted(n),0,n);
}

Array.prototype.placementForSorted = function(n) {
	var l = 0,u = this.length;
	while(l<=u) {
		m = parseInt((l+u)/2);
		if (n<this[m]) u=m-1;
		else if (n==this[m]) return -1;
		else l=m+1;
	}
	return l;
}

Array.prototype.indexOfSorted = function(n) {
	var l = 0,u = this.length;
	while(l<=u) {
		m = parseInt((l+u)/2);
		if (n<this[m]) u=m-1;
		else if (n==this[m]) return m;
		else l=m+1;
	}
	return -1;
}

String.format = function() {
	if ((al = arguments.length) == 0) return "";
	var str = arguments[0];
	for(var i=1;i<=al;i++) str = str.replace("{"+(i-1)+"}",arguments[i]);
	return str;
}

function Clone(p,c) {
var c = c||{};
for (var i in p) {
  if (typeof p[i] === 'object') {
    c[i] = (p[i].constructor === Array)?[]:{};
    Clone(p[i],c[i]);
  } else c[i] = p[i];}
return c;
}

function max(a,b) {
	if (a<b) return b;
	return a;
}