const cRaterUsername = process.env.C_RATER_USERNAME;
const cRaterPassword = process.env.C_RATER_PASSWORD;
if (!cRaterUsername || !cRaterPassword) {
  throw new Error("Missing C_RATER_USERNAME or C_RATER_PASSWORD environment variable!");
}

exports.authorizationValue = `Basic ${new Buffer(`${cRaterUsername}:${cRaterPassword}`).toString('base64')}`;