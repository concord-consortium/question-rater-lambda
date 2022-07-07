const {headers} = require("../index");

const ignoreWhiteSpace = (string) => string.replace(/[\r|\n|\t\s]?/gm, "");

const assertXmlMatch = (actual, expected) => {
  expect(ignoreWhiteSpace(actual)).toEqual(ignoreWhiteSpace(expected));
}

const errorResult = (error, includeClientId) => {
  return {
    statusCode: 400,
    headers,
    body: `<crater-results>\n  <tracking id="12345"/>\n${includeClientId ? "  <client id=\"cc\"/>\n" : ""}  <error code="400">${error}</error>\n</crater-results>`
  }
}

module.exports = {
  assertXmlMatch,
  errorResult,
};
