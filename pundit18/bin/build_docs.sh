#!/bin/sh

v=`/usr/bin/head -1 VERSION.txt`
pname="ASK $v"
yuidoc=./node_modules/.bin/yuidoc

# echo "Use '$0 lint' to double check your comments"

runtype="${1:-build}"
rm -f yuidoc.json 
sed "s%{pundit-version}%${pname}%g" bin/yuidoc.json-template > yuidoc.json

[ $runtype == 'build' ] && { 
    echo "Building the docs for $pname: \n\n"; 
    yuidoc
}

[ $runtype == 'lint' ] && { 
    echo "Linting comments:\n"; 
    yuidoc --lint
    [ $? -eq 0 ] && { echo "No errors found in the comments. Congratulations!"; }
}

rm -f yuidoc.json