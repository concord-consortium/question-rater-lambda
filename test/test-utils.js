const ignoreWhiteSpace = (string) => string.replace(/[\r|\n|\t\s]?/gm, "");

const assertXmlMatch = (actual, expected) => {
  expect(ignoreWhiteSpace(actual)).toEqual(ignoreWhiteSpace(expected));
}

const errorResult = (error, includeClientId) => {
  return {
    statusCode: 400,
    body: `<crater-results>\n  <tracking id=\"12345\"/>\n${includeClientId ? "  <client id=\"cc\"/>\n" : ""}  <error>${error}</error>\n</crater-results>`
  }
}

module.exports = {
  assertXmlMatch,
  errorResult,
};