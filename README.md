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
  "videoTitle": "Legendairy Milk Party",
  "videoDescription": "Music credit to ray kwan",
  "watermarkUrl": "https://s3.amazonaws.com/thebosco/watermarks/watermark-90.png",
  "endcardUrl": "https://s3.amazonaws.com/russbosco/events/timelapseparty/endcard.jpg",
  "sourceFiles": [ 
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif",
    "https://s3.amazonaws.com/thebosco/events/vfiles-nyfw/77JZTR.gif"
  ]
}
```

###required params

- `workBucket` - Bucket this function uses for temp work (storing pngs and mp4s)
- `sourceFiles` - An array of URLs pointing to the timelapse's images
- `musicUrl` - URL for the mp3 to be included in the final video
- `videoTitle` - Title for the Vimeo video to be uploaded
- `videoDescription` - Set literally to the `description` tag on the vimeo video

###optional params

- `watermarkUrl` - Watermark to be applied to all the images in the timelapse (except the endcard)
- `endcardUrl` - Card to be displayed at the end of the video - currently displays for 45 frames
