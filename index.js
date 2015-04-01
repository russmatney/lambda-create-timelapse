var Q = require('q');
var execute = require('lambduh-execute');
var glob = require('glob');

var pathToGifs = '~/Desktop/timelapse_stuff/sample_gifs';
var pathToTimelapse = './bin/timelapse.sh';

exports.handler = function(event, context) {
  var start = new Date();
  console.log('handler');

  var result = {};
  execute(result, {
    shell: 'rm /tmp/work/*',
    logOutput: true
  }).then(function(result) {
    var def = Q.defer();

    var promises = [];
    glob('/tmp/downloaded-gifs/**.gif', function(err, files) {
      result.numberOfGifs = files.length;
      if (err) { def.reject(err) }
      files.forEach(function(file) {
        promises.push(execute(null, {
          bashScript: "./bin/gif-to-png.sh",
          bashParams: [file],
          logOutput: true
        }));
      });

      console.log('promises');
      console.log(promises);

      Q.all(promises)
        .then(function(results) {
          console.log('resolved!');

          def.resolve(result);
        });

    });

    return def.promise;
  }).then(function(result) {
    return execute(result, {
      bashScript: './bin/rename-pngs.sh',
      bashParams: [],
      logOutput: true
    })
  }).then(function(result) {
    return execute(result, {
      bashScript: './bin/append-endcard.sh',
      //Assumes at most 4 pngs per gif
      bashParams: [
        '/tmp/endcard.jpg', //src endcard
        result.numberOfGifs * 4 //initial X for naming these cards
      ],
      logOutput: true
    })
  }).then(function(result) {
    return execute(result, {
      bashScript: './bin/files-to-mp4.sh',
      bashParams: [
        '/tmp/work/%04d.png', //input files
        '/tmp/song.mp3', //input song
        '/tmp/timelapse.mp4' //output filename
      ],
      logOutput: true
    })
  })
  //TODO: exec should reject the error, not the 'result/options'
  .then(function() {
    console.log("Finished");
    console.log('duration in ms: ');
    console.log((new Date()).getTime() - start.getTime());
    context.done()
  }).fail(function(err) {
    if(err) {
      context.done(err)
    } else {
      context.done(new Error("Unspecifed fail."))
    }
  });
}
