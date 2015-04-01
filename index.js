var Q = require('q');
var execute = require('lambduh-execute');

var pathToGifs = '~/Desktop/timelapse_stuff/sample_gifs';
var pathToTimelapse = './bin/timelapse.sh';

exports.handler = function(event, context) {
  console.log('handler');

  //TODO: exec should reject the error, not the 'result/options'
  execute(null, {
    bashScript:  pathToTimelapse,
    logOutput: true
  }).then(function() {
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
