#!/bin/bash
# Strip byte-order marks and non-ASCII from the files that fail at line 1, char 0.
# These are transfer artifacts, not proof defects. Run inside the mc108 directory.
FILES="f001.v f002.v f003.v f004.v f005.v f006.v f007.v f008.v f009.v f010.v \
f011.v f012.v f013.v f014.v f015.v f016.v f017.v f018.v f070.v f071.v f086.v"
rec=0; still=0
for f in $FILES; do
  [ -f "$f" ] || { echo "missing $f"; continue; }
  cp "$f" "$f.bak"
  sed -i '1s/^\xEF\xBB\xBF//' "$f"                 # UTF-8 BOM
  sed -i 's/[\xE2\x80\x98\x99]/'"'"'/g' "$f"       # smart single quotes
  sed -i 's/[\xE2\x80\x9C\x9D]/"/g' "$f"           # smart double quotes
  if coqc -q "$f" >/dev/null 2>&1; then
    echo "RECOVERED  $f"; rec=$((rec+1))
  else
    echo "still fails $f — $(coqc -q "$f" 2>&1 | grep -m1 Error: | cut -c1-70)"
    still=$((still+1))
  fi
done
echo
echo "recovered $rec, still failing $still"
echo "originals kept as *.bak"
