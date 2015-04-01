#/bin/bash

# convert endcard to PNG
convert $1 PNG24:/tmp/endcard.png
X=$(($2)) # assumes 4 pics per gif
echo "X: " $X
# copy the end card using the same X from above
for i in {1..45}; do
  NEWNAME=$(printf %04d.%s ${X%.*} ${f##*.})
  NEWNAME=${NEWNAME:0:4}
  let X="$X+1"
  cp /tmp/endcard.png /tmp/work/$NEWNAME.png
done

