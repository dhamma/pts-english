var fs=require('fs');
var source="raw/";
var sax=require("sax");
var parser=sax.parser(false);
//var lst=["dn","mn","sn","an"];
var lst=["dn"];
var output=[];
var ndef=[];
var bookid=1,suttaid=""; //for page break and foot note

var getmain=function(content,fn){
	var start=content.indexOf('<div class="main">');
	var end=content.lastIndexOf("</div>");
	if (start==-1 || end==-1) throw "cannot find div main";
	return content.substring(start,end+6);
}
var replaceEntity=function(content,fn){
	return content.replace(/&#x([0-9a-f]+);/g,function(m,m1){
		return String.fromCharCode(parseInt(m1,16));
	}).replace(/&#([0-9]+);/g,function(m,m1){
		return String.fromCharCode(parseInt(m1,10));
	});
}
var textline="",paracount=1;
var linktype=0, inNdef=false,done=false;
var parseA=function(node){
	if (node.attributes.ID) {
		var pg=node.attributes.ID.match(/pg(\d+)/);
		var pts=node.attributes.ID.match(/pt(\d+)/);
		var p=node.attributes.ID.match(/p(\d+)/);
		var footnote=node.attributes.ID.match(/fn(\d+)/);
		var note=node.attributes.ID.match(/n(\d+)/);
		if (pg) {
			textline+="~"+pg[1];//book id from output filename
			linktype=11;
		}
		if (footnote||note) {
			textline+="#"+suttaid+"."+note[1];
			linktype=11;
		}
		if (p){
			textline+="^"+suttaid+"."+p[1];
			linktype=11;
		}
		if (pts){
			textline+="~p"+pts[1];
			linktype=11;
		}

	} else {
		linktype=12;
	}
}
var knownPattern=function(content,fn){
	pts=/<span class="f3"><b>\[(\d+)\]<\/b><\/span>/g

	return content.replace(pts,function(m,m1){
		return "~p"+m1;
	});
}
var parseP=function(node){
	if (node.attributes.CLASS) {
		if (inNdef) {
			ndef.push(textline);
			textline="";
		}
		if (node.attributes.CLASS=="lgqt") {
			inNdef=true;
		} else if (inNdef) {
			//output finish
			done=true;
		}
	}else {
		output.push(textline);
		textline="";
		paracount++;		
	}
}
var parseHTML=function(content,fn){
	paracount=1;
	inNdef=false;
	done=false;
	parser.onopentag=function(node){
		//console.log(node)
		if (done)return;
		if (node.name=="BR") {
			output.push(textline);
			textline="";
		}
		if (node.name=="P") {
			parseP(node);
		}
		if (node.name=="A") {
			parseA(node);
		}
	}
	parser.onclosetag=function(node){
		if (done)return;
		if (node=="A") {
			linktype=0;
		}
	}
	parser.ontext=function(t){
		if (done)return;

		if (linktype>10)return;//ignore
		textline+=t;
	}
	parser.write(content).close();
	output.push(textline);
}

var lastwritefile="";
var cleanup=function(content,fn){
	return content.replace(/\[\]/g,"")
		.replace(/<\/span>/g,"")
		.replace(/\[(#[0-9a-z.]+)\]/g,function(m,m1){
			return m1;
		}).replace(/\[(\^[0-9a-z.]+)\]/g,function(m,m1){
			return m1;
		});
}
var writefile=function(fn){
	if (lastwritefile) {
		var out=output.join("\n");
		out=cleanup(out,fn);
		console.log("write to",lastwritefile,"lines",output.length);
		fs.writeFile(lastwritefile,out,"utf8");

		var ndefout=ndef.join("\n");
		ndefout=cleanup(ndefout);
		var ndeffn=lastwritefile.replace(".txt","-ndef.txt");
		fs.writeFile(ndeffn,ndefout,"utf8");
		output=[],ndef=[];
	}
	lastwritefile=fn||"";
	if (!fn)return;

	bookid=fn[0]+parseInt(fn.substr(1));
}
var getSuttaIdFromFilename=function(fn){
	var dn=fn.match(/dn\.(\d+)/);
	var mn=fn.match(/mn\.(\d+)/);
	var sn=fn.match(/sn\d\d\.(\d+).(\d+)/);
	var an=fn.match(/an\.(\d+)\.(\d+)/);
	if (dn) return "dn"+dn[1].replace(/^0/g,"");
	if (mn) return "mn"+mn[1].replace(/^0/g,"");
	if (sn) return "sn"+sn[1].replace(/^0/g,"")+"."+sn[2].replace(/^0/g,"");
	if (an) return "an"+an[1].replace(/^0/g,"")+"."+an[2].replace(/^0/g,"");
}
var processfile=function(fn){
	if (fn[0]==">"){
		writefile(fn.substr(1));
		return;
	}
	suttaid=getSuttaIdFromFilename(fn);
	var content=fs.readFileSync(source+fn,"utf8").replace(/\r?\n/g,"\n");
	content=getmain(content,fn);
	content=replaceEntity(content,fn);
	content=knownPattern(content,fn);
	//console.log(content.length,fn)
	parseHTML(content,fn);
}
var processnikaya=function(nikaya){
	var files=fs.readFileSync(source+nikaya+".lst","utf8").split(/\r?\n/);
	files.forEach(processfile);
}
lst.forEach(processnikaya);
writefile();