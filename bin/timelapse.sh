# set the counter
X=1

# change directory
cd /tmp

# make the work directory if it doesn't exist
if [ ! -d "/tmp/work" ]; then
	mkdir /tmp/work
fi

# empty anything old out of the work folder
rm -r /tmp/work/*

for f in *.jpg; do
	# make the new name
	echo "Processing" $f
	NEWNAME=$(printf %04d.%s ${X%.*} ${f##*.})
	NEWNAME=${NEWNAME:0:4}
	let X="$X+1"

	# rotate, scale, convert to png
	convert $f -gravity center \
	  -scale 720 -extent 1280x720 \
	  -background white PNG24:/tmp/work/$NEWNAME.png

	# add watermark
	if [ -f "/tmp/watermark.png" ]; then
		convert /tmp/watermark.png -scale 720 /tmp/watermark.png
		composite /tmp/watermark.png -geometry +280+0 /tmp/work/$NEWNAME.png /tmp/work/$NEWNAME.png
	fi
done

# convert to endcard to PNG
convert /tmp/endcard.jpg PNG24:/tmp/endcard.png

# copy the end card for it to be added to the end
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

