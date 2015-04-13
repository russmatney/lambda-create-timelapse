var Q = require('q');
var AWS = require('aws-sdk');
var validate = require('lambduh-validate');
var Lambda = new AWS.Lambda();
var S3 = new AWS.S3();

var orchFilesToPngs = function(event) {
  var def = Q.defer();
  console.log('orchestrating files-to-pngs')
  console.log(event);

  var promises = [];
  event.sourceFiles.forEach(function(url) {
    promises.push(function() {
      var defer = Q.defer();
      Lambda.invokeAsync({
        FunctionName: "file-to-png",
        InvokeArgs: JSON.stringify({
          srcUrl: url,
          destBucket: event.workBucket,
          pngsDir: event.pngsDir,
          watermarkUrl: event.watermarkUrl
        })
      }, function(err, data) {
        if (err) {
          defer.reject(err);
        } else {
          defer.resolve(event);
        }
      });
      return defer.promise;
    }())
  });

  Q.all(promises)
    .then(function(invocationCbs) {
      console.log(invocationCbs.length + " lambda functions invoked!");
      def.resolve(event);
    })
    .fail(function(err) {
      def.reject(err);
    })

  return def.promise;
};

var orchPngsToMp4s = function(event) {
  var def = Q.defer();
  console.log('Orchestrating pngs-to-mp4s');
  console.log(event);

  //list s3 objects in bucket
  S3.listObjects({
    Bucket: event.workBucket,
    Prefix: event.pngsDir
  }, function(err, data) {
    if (err) def.reject(err);
    else {
      var keys = data.Contents.map(function(object) {
        //only .pngs
        if (/\.png/.test(object.Key)) {
          return object.Key;
        }
      });

      //break into chunks of fixed size
      var keyGroups = [];
      console.log(keys.length + " pngs split into");
      while(keys.length % (event.pngsPerVideo || 50) > 0) {
        keyGroups.push(keys.splice(0, event.pngsPerVideo || 50))
      }
      console.log(keyGroups.length + " groups");

      var promises = [];
      var groupNum = 0;

      //invoke lambda func per group of keys
      keyGroups.forEach(function(keys) {
        promises.push(function() {
          var defer = Q.defer();
          Lambda.invokeAsync({
            FunctionName: "pngs-to-mp4",
            InvokeArgs: JSON.stringify({
              srcBucket: event.workBucket,
              srcKeys: keys,
              dstBucket: event.workBucket,
              //TODO: pad groupNum to preserve video order
              dstKey: event.mp4sDir + "/video-" + groupNum++ + ".mp4"
            })
          }, function(err, data) {
            if (err) {
              defer.reject(err);
            } else {
              defer.resolve(data);
            }
          })
          return defer.promise;
        }())
      })

      //invoke lambda func for endcard
      promises.push(function() {
        var defer = Q.defer();
        Lambda.invokeAsync({
          FunctionName: "pngs-to-mp4",
          InvokeArgs: JSON.stringify({
            srcBucket: "none",
            srcKeys: "none",
            srcUrl: event.endcardUrl,
            dstBucket: event.workBucket,
            dstKey: event.mp4sDir + "/video-endcard.mp4"
          })
        }, function(err, data) {
          if (err) {
            defer.reject(err);
          } else {
            defer.resolve(data);
          }
        })
        return defer.promise;
      }())

      Q.all(promises)
        .then(function(invocationCbs) {
          console.log(invocationCbs.length + ' lambda funcs invoked');
          def.resolve(event);
        })
        .fail(function(err) {
          def.reject(err);
        })

    }
  })

  return def.promise;
};

var mp4sToTimelapse = function(event) {
  var def = Q.defer();
  console.log('invoking mp4sToTimelapse');
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
  console.log('invoking upload-to-vimeo');
  console.log(event);

  Lambda.invokeAsync({
    FunctionName: "upload-to-vimeo",
    InvokeArgs: JSON.stringify({
      sourceBucket: event.workBucket,
      sourceKey: event.timelapseDestKey,
      videoDescription: event.videoDescription,
      videoTitle: event.videoTitle

    })
  }, function(err, data) {
    if (err) {
      def.reject(err);
    } else {
      console.log('upload-to-vimeo invoked');
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
    videoDescription: true,
    videoTitle: true,
    endcardUrl: true // don't require - hard-code fallback if it doesn't exist
  })

  .then(function(event) {
    event.pngsDir = "events/" + event.videoTitle + "/timelapse/pngs";
    event.mp4sDir = "events/" + event.videoTitle + "/timelapse";
    event.timelapseDestKey = "events/" + event.videoTitle + "/timelapse/timelapse-final.mp4";
    event.finalTimelapseBucket = event.finalTimelapseBucket || event.workBucket;

    return event;
  })

  .then(function(event) {
    console.log('determining stage in process with data:');
    console.log(event);

    if (!event.msWaited && !event.orchFilesToPngsCalled) {
      event.msWaited = 0;
      console.log("first time: invoke orch-files-to-pngs")
      event.orchFilesToPngsCalled = true;
      return orchFilesToPngs(event);

      //probably want to wait for 3 rounds of this conversion - > 9 minutes or so
      //600,000 ms = 10 min
    } else if (event.msWaited > 600000 && !event.orchPngsToMp4sCalled) {
      console.log("after 600000 ms: invoke orch-pngs-to-mp4s")
      event.orchPngsToMp4sCalled = true;
      return orchPngsToMp4s(event);

      //900,000 ms = 15 min
    } else if (event.msWaited > 900000 && !event.mp4sToTimelapseCalled) {
      console.log("after 900000 ms: invoke mp4s-to-timelapse")
      event.mp4sToTimelapseCalled = true;
      return mp4sToTimelapse(event);

      //1,200,000 ms = 20 min
    } else if (event.msWaited > 1200000 && !event.uploadToVimeoCalled) {
      console.log("after 1200000 ms: invoke upload-to-vimeo")
      event.uploadToVimeoCalled = true;
      return uploadToVimeo(event);

    } else {
      return event;
    }
  })

  .then(function(event) {
    var def = Q.defer();

    if (event.uploadToVimeoCalled) {
      console.log('finished');
      console.log(event);
      def.resolve(event);
    } else {

      var timeout = 45001;
      setTimeout(function() {
        event.msWaited += timeout;
        Lambda.invokeAsync({
          FunctionName: "create-timelapse",
          InvokeArgs: JSON.stringify(event)
        }, function(err, data) {
          if (err) {
            def.reject(err);
          } else {
            console.log('create-timelapse re-invoked with data:')
            console.log(event);
            def.resolve(event);
          }
        });
      }, timeout);
    }

    return def.promise;
  })

  .then(function(event) {
    context.done();
  })

  .fail(function(error) {
    console.log('error');
    console.log(error);
    context.done(null, error);
  })

}
