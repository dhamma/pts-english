var fs=require("fs");
var request=require("request");
var errors=[],files=[],now=0,nnow=0;
var nikayas=["sn","an","mn","dn"],nikaya="";

var nextNikaya=function(){
	if (nnow>=nikayas.length) {
		fs.writeFileSync("errorfetch.txt",errors.join("\n"),"utf8");
		return;
	}
	nikaya=nikayas[nnow++];
	files=fs.readFileSync(nikaya+"_url.txt","utf8").split(/\r?\n/);
	now=0;
	fetchfile();
}
var fetchfile=function(){
	if (now>=files.length) {
		setTimeout(nextNikaya);
		return;
	}
	url=files[now++];
	
	request({url,encoding:"utf8"}, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	var fn=url.match(/[^\/]+htm/)[0];
	  	console.log(fn,body.length);
	  	fs.writeFileSync("raw/"+nikaya+"/"+fn,body,"utf8");
	  } else {
	  	errors.push(url);
	  }
	  setTimeout(function(){
	  	fetchfile();
	  },500);
	 });
}


nextNikaya();
