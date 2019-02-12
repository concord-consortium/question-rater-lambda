rm question-rater.zip
rm -rf node_modules
npm install --production
zip -r9 question-rater.zip . -x *.git* build.sh test/\* README.md package-lock.json package.json
npm install
