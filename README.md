# bosco-time-lapse

Lambda function that creates a timelapse


#usage

`create-timelapse` expects to be invoked with an event object.

##invokage

Lambda functions can be invoked in several ways, as documented by the AWS SDK.

Here are links to [PHP](http://docs.aws.amazon.com/aws-sdk-php/latest/class-Aws.Lambda.LambdaClient.html#_invokeAsync) and [Node](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html).

##event object

```
//example event object
{
  "workBucket": "russbosco",
  "musicUrl": "https://s3.amazonaws.com/russbosco/events/timelapseparty/Channel+Live.mp3",
  "musicCredit": "LoZ",
  "videoTitle": "awesomeparty201",
  "watermarkUrl": "https://s3.amazonaws.com/thebosco/watermarks/watermark-90.png",
  "endcardUrl": "https://s3.amazonaws.com/russbosco/events/timelapseparty/endcard.jpg",
  "timelapseFinalKey": "timelapse-final.mp4",
  "sourceFiles": {
    "77JZTR": {
      "raw": {
        "filename": "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
        "created": "2013-02-08 08:04:14"
      }
    }
  }
}
```

###required params

- `workBucket` - Bucket this function uses for temp work (storing pngs and mp4s)
- `sourceFiles` - An array of URLs pointing to the timelapse's images
- `musicUrl` - URL for the mp3 to be included in the final video
- `videoTitle` - Title for the Vimeo video to be uploaded
- `videoDescription` - Set literally to the `description` tag on the vimeo video

###optional params

- `watermarkUrl`
- `endcardUrl`
