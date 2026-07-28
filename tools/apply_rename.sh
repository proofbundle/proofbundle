#!/bin/bash
# Reorganise the mc108 source tree by property. Run from the directory holding fNNN.v.
# Verifies each file's sha256 before moving. Nothing is deleted; git mv if available.
set -u
MAP="$(dirname "$0")/RENAME.tsv"
MV="mv"; git rev-parse --is-inside-work-tree >/dev/null 2>&1 && MV="git mv"
moved=0; skipped=0; badhash=0
while IFS=$'\t' read -r origin status fw princ st cl ax sha newpath; do
  [ "$origin" = "origin" ] && continue
  [ -f "$origin" ] || { echo "absent   $origin"; skipped=$((skipped+1)); continue; }
  actual=$(sha256sum "$origin" | cut -d' ' -f1)
  if [ "$actual" != "$sha" ]; then
    echo "HASH MISMATCH $origin"; echo "  expected $sha"; echo "  actual   $actual"
    badhash=$((badhash+1)); continue
  fi
  mkdir -p "$(dirname "$newpath")"
  $MV "$origin" "$newpath" && { echo "moved    $origin -> $newpath"; moved=$((moved+1)); }
done < "$MAP"
echo; echo "moved $moved   absent $skipped   hash mismatch $badhash"
