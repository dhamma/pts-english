var fs=require("fs");
var baseurl="http://obo.genaud.net/";
var nikaya=["dn","mn","sn","an"];

var getUrl=function(nikaya){
	var folder="index/"+nikaya+"/";
	var files=lst=fs.readFileSync(folder+"file.lst","utf8").split(/\r?\n/);
	var urls={};
	var processfile=function(fn){
		var content=fs.readFileSync(folder+fn,"utf8");
		content.replace(/<a href="(.*?\.pts\.htm)/g,function(m,m1){
			if (m1.indexOf(nikaya)>-1) urls[m1]=true;
		});
	}
	files.map(processfile);
	urls = Object.keys(urls);
	urls=urls.map(function(m){ 
		m=m.replace("../","").replace("../","").replace("../","").replace("../","").replace("../","").replace("../","");
		return baseurl+m;
	})
	fs.writeFileSync(nikaya+"_url.txt",urls.join("\n"),"utf8");
}

nikaya.map(getUrl);


