var Q = require('q');
var AWS = require('aws-sdk');
var validate = require('lambduh-validate');
var Lambda = new AWS.Lambda();

var orchFilesToPngs = function(event) {
  var def = Q.defer();
  console.log(event);

  var fileUrls = Object.keys(event.sourceFiles).map(function(file) {
    return event.sourceFiles[file].raw.filename;
  });

  Lambda.invokeAsync({
    FunctionName: "orchestrate-files-to-pngs",
    InvokeArgs: JSON.stringify({
      sourceUrls: fileUrls,
      destBucket: event.workBucket,
      destDir: event.pngsDir,
      watermarkUrl: event.watermarkUrl
    })
  }, function(err, data) {
    if (err) {
      def.reject(err);
    } else {
      console.log('orchestrate-files-to-pngs invoked');
      console.log(data);
      def.resolve(event);
    }
  });

  return def.promise;
};

var orchPngsToMp4s = function(event) {
  var def = Q.defer();
  console.log(event);

  Lambda.invokeAsync({
    FunctionName: "orchestrate-pngs-to-mp4s",
    InvokeArgs: JSON.stringify({
      sourceBucket: event.workBucket,
      sourceDir: event.pngsDir,
      destBucket: event.workBucket,
      destDir: event.mp4sDir,
      endcardUrl: event.endcardUrl
    })
  }, function(err, data) {
    if (err) {
      def.reject(err);
    } else {
      console.log('orchestrate-pngs-to-mp4s invoked');
      console.log(data);
      def.resolve(event);
    }
  });

  return def.promise;
};

var mp4sToTimelapse = function(event) {
  var def = Q.defer();
  console.log(event);

  Lambda.invokeAsync({
    FunctionName: "mp4s-to-timelapse",
    InvokeArgs: JSON.stringify({
      sourceBucket: event.workBucket,
      sourceDir: event.mp4sDir,
      musicUrl: event.musicUrl,
      //save to another s3 bucket?
      destBucket: event.finalTimelapseBucket,
      destKey: event.timelapseDestKey,
    })
  }, function(err, data) {
    if (err) {
      def.reject(err);
    } else {
      console.log('mp4s-to-timelapse invoked');
      console.log(data);
      def.resolve(event);
    }
  });

  return def.promise;
};

var uploadToVimeo = function(event) {
  var def = Q.defer();
  console.log(event);

  Lambda.invokeAsync({
    FunctionName: "upload-to-vimeo",
    InvokeArgs: JSON.stringify({
      sourceBucket: event.workBucket,
      sourceKey: event.timelapseDestKey,
      musicCredit: event.musicCredit,
      videoTitle: event.videoTitle

    })
  }, function(err, data) {
    if (err) {
      def.reject(err);
    } else {
      console.log('mp4s-to-timelapse invoked');
      console.log(data);
      def.resolve(event);
    }
  });

  return def.promise;
};




exports.handler = function(event, context) {

  validate(event, {
    sourceFiles: true,
    workBucket: true,
    musicUrl: true,
    musicCredit: true,
    videoTitle: true,
    watermarkUrl: true,
    endcardUrl: true
  })

  .then(function(event) {
    event.pngsDir = event.videoTitle + "/timelapse/pngs";
    event.mp4sDir = event.videoTitle + "/timelapse";
    event.timelapseDestKey = event.videoTitle + "/timelapse/timelapse-final.mp4";
    //TODO: final bucket?
    event.finalTimelapseBucket = event.workBucket;
  })

  .then(function(event) {
    var def = Q.defer();

    if (!event.msWaited && !event.orchFilesToPngs) {
      event.msWaited = 0;
      //if first time, invoke orch-files-to-pngs and mark call made
      console.log("first time: invoke orch-files-to-pngs")
      event.orchFilesToPngs = true;

    } else if (event.msWaited > 300000 && !event.orchPngsToMp4sCalled) {
      //if after X ms, invoke orch-pngs-to-mp4s and mark call made
      console.log("after 300000 ms: invoke orch-pngs-to-mp4s")
      event.orchPngsToMp4sCalled = true;

    } else if (event.msWaited > 600000 && !event.mp4sToTimelapse) {
      //if after X ms, invoke mp4s-to-timelapse and mark call made
      console.log("after 600000 ms: invoke mp4s-to-timelapse")
      event.mp4sToTimelapse = true;

    } else if (event.msWaited > 720000 && !event.uploadToVimeo) {
      //if after X ms, invoke upload-to-vimeo and mark call made
      console.log("after 720000 ms: invoke upload-to-vimeo")
      event.uploadToVimeo = true;

    }


    if (event.uploadToVimeo) {
      def.resolve(event);
    } else {
      //unless invoking last process, wait 30 seconds
      //increment call count and total time running
      //invoke self with updated event data

      var timeout = 30000;
      setTimeout(function() {
        event.msWaited += timeout;
        Lambda.invokeAsync({
          FunctionName: "create-timelapse",
          InvokeArgs: JSON.stringify(event)
        }, function(err, data) {
          if (err) {
            def.reject(err);
          } else {
            def.resolve(event);
          }
        });
      }, timeout);
    }

    return def.promise;
  })

  .then(function(event) {
    console.log('finished');
    console.log(event);
    context.done();
  })

  .fail(function(error) {
    console.log('error');
    console.log(error);
    context.done(null, error);
  })

}
