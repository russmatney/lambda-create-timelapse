var Q = require('q');
var execute = require('lambduh-execute');
var glob = require('glob');

var pathToGifs = '~/Desktop/timelapse_stuff/sample_gifs';
var pathToTimelapse = './bin/timelapse.sh';
var pathToFilesToMp4 = './bin/files-to-mp4.sh';
var pathToAppendEndcard = './bin/append-endcard.sh';
var pathToRenamePngs = './bin/rename-pngs.sh';
var pathToFileToPng = "./bin/file-to-png.sh";

exports.handler = function(event, context) {
  var start = new Date();
  console.log('handler');

  var result = {};
  execute(result, {
    shell: 'rm /tmp/work/*',
    logOutput: true
  }).then(function(result) {



  }).then(function(result) {
    console.log('renaming pngs');

    return execute(result, {
      bashScript: pathToRenamePngs,
      bashParams: [],
      logOutput: true
    })
  }).then(function(result) {
    console.log('appending endcard');
    var def = Q.defer();

    glob('/tmp/work/**.png', function(err, files) {
      var fileCount = files.length;

      def.resolve(execute(result, {
        bashScript: pathToAppendEndcard,
        //Assumes at most 4 pngs per gif
        bashParams: [
          '/tmp/endcard.jpg', //src endcard
          fileCount //initial X for naming these cards
        ],
        logOutput: true
      }))
    })
    return def.promise;
  }).then(function(result) {
    console.log('creating mp4');

    return execute(result, {
      bashScript: pathToFilesToMp4,
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





/*
//async firing of a script per file in a glob
  .then(function(result) {
    var def = Q.defer();
    var promises = [];
    glob('/tmp/downloaded-jpgs-full/**.jpg', function(err, files) {
      if (err) { def.reject(err) }
      files.forEach(function(file) {
        promises.push(execute(null, {
          bashScript: pathToGifToPng,
          bashParams: [file],
          logOutput: true
        }));
      });

      Q.all(promises)
        .then(function(results) {
          console.log('resolved!');
          def.resolve(result);
        });
    });
    return def.promise;
  })

*/

