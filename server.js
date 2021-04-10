const express = require('express');
const app = express();
const pixel = express();
const port = process.env.PORT || 3000;

const isImage = require('is-image-url');
const isUrl = require('is-absolute-url');
const getPixels = require('get-pixels-frame-info-update');

app.engine('html', require("ejs").renderFile);

//______________________________________________________________________________


let endofURL = (url)=>url.slice(-5) //url MUST be a string to work

app.use("/pixel", pixel)//(req,res)=>{res.send("Hello There")})


app.get("/", (req,res)=>{res.render(__dirname+"/index.html")})

app.get("/ping", (req,res)=>{
  res.send("pong");
})



//path = "/pixel/data" and/or /pixel/data?url=
pixel.get("/data", (req,res)=>{
	var url = req.query.url;
  	if (url){
		var end = endofURL(url)
    	console.log(url)
    	if (isUrl(url)) {
			console.log("URL, ending in " + end + ", is real")
      		if (isImage(url)) {
    			console.log("URL, ending in " + end + ", is an image")
        		getPixels(url, function(err, pixels, frameInfo) {
  					if (err) {
  						console.log(err)
  						return
  					} else {
  						var array = [];
  						if(pixels.shape.length < 4){
  							var width = pixels.shape[0];
  							var height = pixels.shape[1];
              				var frame = [];
  							for(var y = 0;y < height;y++){
  								var row = [];
  								for(var x = 0;x < width;x++){
  									var r = pixels.get(x,y,0);
  									var g = pixels.get(x,y,1);
  									var b = pixels.get(x,y,2);
  									var a = 127 - (pixels.get(x,y,3)*(127/255));
  									var pixel = [r,g,b,a];
  									row.push(pixel);
  								}
  								frame.push(row);
  							}
              				array.push(frame)
  						} else {
							var frames = pixels.shape[0];
							var width = pixels.shape[1];
							var height = pixels.shape[2];
							console.log(pixels.shape[3]);
							console.log("got pixels", typeof pixels.shape)
							var state = [];
							for(var z = 0; z < frames; z++){ // z represents the specific frame of a gif
  								var frame = [];
                				var dispose = frameInfo.disposal;
  								for(var y = 0; y < height; y++){
                 					state[y] = state[y] || [];
  									var row = [];
  									for(var x = 0; x < width; x++){
                    					state[y][x] = state[y][x].slice() || [0,0,0,127];
										var r = pixels.get(z,x,y,0);
										var g = pixels.get(z,x,y,1);
										var b = pixels.get(z,x,y,2);
										var a = 127 - (pixels.get(z,x,y,3)*(127/255));
										var pixel;
										var empty = a === 127;
										if (empty){
											if (y==1&&x==1){
												console.log(state[y][x], state[y][x].slice())
											}
											pixel = state[y][x].slice();
										}else{
											pixel = [r,g,b,a];
										}
  										row.push(pixel);
										if (dispose <= 1 && !empty) { //Dispose 0 (Unspecified) and Dispose 1 (Do Not Dispose) mean save the frame to the state
											state[y][x] = pixel.slice();
										} else if (dispose === 2) { //Dispose 2 (Restore To Background) means nuke the state
											state[y][x] = [0,0,0,127];
										} //Dispose 3 (Restore to Previous) means do not save the frame to the state, so no changes to the state are needed
  									}
  									frame.push(row);
  								}
  								//frame.push(frameInfo.delay); //Times 10 because GIF protocols specify delay in terms of 100ths of a second, not milliseconds (which are 1000ths)
  								array.push(frame);
  							}
  						}
  						var json = JSON.stringify(array);
  						res.send(json);
  					}
  				});
    		} else {
    			console.log("URL, ending in " + end + ", is not an image")
    		}
		} else {
      		console.log("URL, ending in " + end + ", is false")
		}
	} else {
		res.send("No URL given. The params should be /pixel/data?url=(URL)")
  	}
})

app.listen(port, ()=>console.log("Working"))
