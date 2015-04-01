#/bin/bash

echo "Processing file: " $1

baseFileName=`basename $1 .gif`
convert $1 -background white \
  -gravity center \
  -scale 720 -extent 1280x720 \
  PNG24:/tmp/work/$baseFileName.png

