# Question Rater lamba function

A zipped version of this repo is used by [question-rater CloudFormation template](https://github.com/concord-consortium/cloud-formation) in the API gateway to proxy requests to an external question rater.

## Building/Updating

1. Run `npm run build` which will create `question-rater.zip`
2. Rename `question-rater.zip` to `question-rater-VERSION.zip`
3. Upload `question-rater-VERSION.zip` to the `concord-devops/question-rater` bucket/folder
4. Edit CloudFormation template to use `question-rater-VERSION.zip`
5. Re-run CloudFormation stack update
