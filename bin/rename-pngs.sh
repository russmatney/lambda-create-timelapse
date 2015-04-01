#/bin/bash

X=0
for f in /tmp/work/*.png; do
  echo "Renaming:" $f
  fileName=$(printf %04d.%s ${X%.*} ${f##*.})
  fileName=${fileName:0:4}
  let X="$X+1"

  mv $f /tmp/work/$fileName.png
done

