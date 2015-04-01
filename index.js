var Q = require('q');
var execute = require('lambduh-execute');
var glob = require('glob');

var pathToGifs = '~/Desktop/timelapse_stuff/sample_gifs';
var pathToTimelapse = './bin/timelapse.sh';

exports.handler = function(event, context) {
  console.log('handler');

  var result = {};
  execute(result, {
    shell: 'rm /tmp/work/*',
    logOutput: true
  }).then(function(result) {
    var def = Q.defer();

    var promises = [];
    glob('/tmp/downloaded-gifs/**.gif', function(err, files) {
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
    //return execute(result, {
      //bashScript:  pathToTimelapse,
      //logOutput: true
    //})
    return;
  })

  //TODO: exec should reject the error, not the 'result/options'
  .then(function() {
    console.log("Finished");
    context.done()
  }).fail(function(err) {
    if(err) {
      context.done(err)
    } else {
      context.done(new Error("Unspecifed fail."))
    }
  });
}
