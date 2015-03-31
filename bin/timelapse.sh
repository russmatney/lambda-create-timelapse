
# make the work directory if it doesn't exist
if [ ! -d "/tmp/work" ]; then
	mkdir /tmp/work
fi

# empty anything old out of the work folder
rm -r /tmp/work/*

# counter
X=1
# process gifs
for f in /tmp/downloaded-gifs/*.gif; do
	# make the new name
	echo "Processing" $f
	NEWNAME=$(printf %04d.%s ${X%.*} ${f##*.})
	NEWNAME=${NEWNAME:0:4}
	let X="$X+1"

	# rotate, scale
	convert $f -background white \
	  -gravity center \
	  -scale 720 -extent 1280x720 \
	  /tmp/prepped-gifs/$NEWNAME.gif

	printf "file '%s'\n" /tmp/prepped-gifs/$NEWNAME.gif >> list.txt

	# add watermark TODO: add to previous step
	#if [ -f "/tmp/watermark.png" ]; then
		#convert /tmp/watermark.png -scale 720 /tmp/watermark.png
		#composite /tmp/watermark.png -geometry +280+0 /tmp/work/$NEWNAME.png /tmp/work/$NEWNAME.png
	#fi
done

# convert endcard to PNG
convert /tmp/endcard.jpg PNG24:/tmp/endcard.png

# add endcard to the end of the .gif list
for i in {1..45}; do printf "file '%s'\n" /tmp/endcard.png >> list.txt; done

# make the mp4
ffmpeg -r 15 \
  -f \
  concat \
  -i list.txt \
  -i /tmp/song.mp3 \
  -map 0:v \
  -map 1:a \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -codec:a aac \
  -strict experimental \
  -b:a 192k \
  -shortest -y /tmp/timelapse.mp4

#ffmpeg -y -f concat -i list.txt -c copy $CODE-final.mp4





