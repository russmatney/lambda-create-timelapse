start=$SECONDS
# make the work directory if it doesn't exist
if [ ! -d "/tmp/work" ]; then
  mkdir /tmp/work
fi

# empty anything old out of the work folder
rm /tmp/work/*

# process gifs
for f in /tmp/downloaded-gifs-full/*.gif; do
	echo "Processing:" $f
  baseFileName=`basename $f .gif`
	echo "Processing" $baseFileName

	# rotate, scale, convert to png
	convert $f -background white \
	  -gravity center \
	  -scale 720 -extent 1280x720 \
	  PNG24:/tmp/work/$baseFileName.png

	# add watermark TODO: add to previous step
	#if [ -f "/tmp/watermark.png" ]; then
		#convert /tmp/watermark.png -scale 720 /tmp/watermark.png
		#composite /tmp/watermark.png -geometry +280+0 /tmp/work/$f.png /tmp/work/$f.png
	#fi
done

duration=$((SECONDS - start))
echo "conversions duration: " $duration

X=0
for f in /tmp/work/*.png; do
  echo "Processing:" $f
  fileName=$(printf %04d.%s ${X%.*} ${f##*.})
  fileName=${fileName:0:4}
  let X="$X+1"

  mv $f /tmp/work/$fileName.png
done

# convert endcard to PNG
convert /tmp/endcard.jpg PNG24:/tmp/endcard.png
# copy the end card using the same X from above
for i in {1..45}; do
  NEWNAME=$(printf %04d.%s ${X%.*} ${f##*.})
  NEWNAME=${NEWNAME:0:4}
  let X="$X+1"
  cp /tmp/endcard.png /tmp/work/$NEWNAME.png
done

# make the mp4
ffmpeg -r 15 \
  -i /tmp/work/%04d.png \
  -i /tmp/song.mp3 \
  -map 0:v \
  -map 1:a \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -codec:a aac \
  -strict experimental \
  -b:a 192k \
  -shortest -y /tmp/timelapse.mp4

duration=$((SECONDS - start))
echo "duration: " $duration
