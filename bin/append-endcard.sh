#/bin/bash

# convert endcard to PNG
convert $1 PNG24:/tmp/endcard.png
echo "\$2: " $2
X=$(($2 * 4)) # assumes 4 pics per gif
# copy the end card using the same X from above
for i in {1..45}; do
  NEWNAME=$(printf %04d.%s ${X%.*} ${f##*.})
  NEWNAME=${NEWNAME:0:4}
  let X="$X+1"
  cp /tmp/endcard.png /tmp/work/$NEWNAME.png
done

