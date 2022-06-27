const cRaterUsername = process.env.C_RATER_USERNAME;
const cRaterPassword = process.env.C_RATER_PASSWORD;
// Dynamically calculated value makes it easier to test
const authorizationEnabled = () => process.env.AUTH_ENABLED === "true";

if (authorizationEnabled() && (!cRaterUsername || !cRaterPassword)) {
  throw new Error("Missing C_RATER_USERNAME or C_RATER_PASSWORD environment variable!");
}

exports.authorizationEnabled = authorizationEnabled;
exports.authorizationValue = `Basic ${Buffer.from(`${cRaterUsername}:${cRaterPassword}`).toString('base64')}`;
