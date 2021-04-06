const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

//______________________________________________________________________________



var getPixels = require('get-pixels')

app.get('/', function (req, res) {
		res.render('index.html');
    res.send('Hello World')
});

app.get('/ping', function (req, res) {
		res.send('pong');
});


app.get('/pixelTransfer/', function (req, res) {
	if (!req.params.data) {
		res.send('Query = {"data" = {"url"}}')
	};
});

app.get('/pixelTransfer/data?', function(req, res){
	var url = req.query.url
	if (url) {
		if (url.match(/^(http\:|https\:).+[.](gif|png|jpg|jpeg)$/)) {
			console.log('url is real')
			console.log(url)
			getPixels(url, function(err, pixels, reader) {
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
					}else{
						var frames = pixels.shape[0];
						var width = pixels.shape[1];
						var height = pixels.shape[2];
            var state = [];
						for(var z = 0;z < frames;z++){
							var frame = [];
              var frameInfo = reader.frameInfo(z);
              var dispose = frameInfo.disposal;
							for(var y = 0;y < height;y++){
                state[y] = state[y] || [];
								var row = [];
								for(var x = 0;x < width;x++){
                  state[y][x] = state[y][x] || [0,0,0,127];
									var r = pixels.get(z,x,y,0);
									var g = pixels.get(z,x,y,1);
									var b = pixels.get(z,x,y,2);
									var a = 127 - (pixels.get(z,x,y,3)*(127/255));
									var pixel;
                  var empty = a === 127;
									if(empty){
										pixel = state[y][x].slice();
									}else{
										pixel = [r,g,b,a];
									}
									row.push(pixel);
                  if(dispose <= 1 && !empty){ //Dispose 0 (Unspecified) and Dispose 1 (Do Not Dispose) mean save the frame to the state
                    state[y][x] = pixel.slice();
                  }else if(dispose === 2){ //Dispose 2 (Restore To Background) means nuke the state
                    state[y][x] = [0,0,0,127];
                  } //Dispose 3 (Restore to Previous) means do not save the frame to the state, so no changes to the state are needed
								}
								frame.push(row);
							}
							frame.push(frameInfo.delay*10); //Times 10 because GIF protocols specify delay in terms of 100ths of a second, not milliseconds (which are 1000ths)
							array.push(frame);
						}
					}
					var json = JSON.stringify(array);
					res.send(json);
				}
			});
		} else {
			console.log('url is fake');
			console.log(url);
			res.send('Url is considered to be fake.');
		}
	} else {
		res.send('No url received.')
	};
});

// error handling
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).send('Something bad happened!');
});

app.listen(port)

console.log('Server running on http://%s:%s', port);
