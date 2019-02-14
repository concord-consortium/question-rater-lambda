const {handler} = require("../index");

const errorResult = (error, includeClientId) => {
  return {
    statusCode: 400,
    body: `<crater-results>\n  <tracking id=\"12345\"/>\n${includeClientId ? "  <client id=\"cc\"/>\n" : ""}  <error>${error}</error>\n</crater-results>`
  }
}

const ignoreWhiteSpace = (string) => string.replace(/[\r|\n|\t\s]?/gm, "");
const assertXmlMatch = (actual, expected) => {
  expect(ignoreWhiteSpace(actual)).toEqual(ignoreWhiteSpace(expected));
}

test("fails with missing body element in event", () => {
  expect(handler({})).resolves.toEqual(errorResult("Error: Missing body element in lambda event!"));
});

test("fails with missing crater-request element in body", () => {
  const event = {
    body: "<test />"
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request top level element in request!"));
});

test("fails with missing crater-request.client element in body", () => {
  const event = {
    body: "<crater-request><test /></crater-request>"
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request.client element in request!"));
});

test("fails with missing crater-request.client id in body", () => {
  const event = {
    body: "<crater-request><client/></crater-request>"
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing id attribute in crater-request.client element in request!"));
});

test("fails with missing crater-request.items in body", () => {
  const event = {
    body: `<crater-request><client id="cc"/><test /></crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request.items element in request!", true));
});

test("fails with missing crater-request.items.item id in body", () => {
  const event = {
    body: `<crater-request><client id="cc"/><items><item><test /></item></items></crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing item id in request!", true));
});

test("fails with missing crater-request.items.item responses in body", () => {
  const event = {
    body: `<crater-request><client id="cc"/><items><item id="123"><test /></item></items></crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing item reqsponses in request!", true));
});

test("fails with missing crater-request.items.item.responses.id in body", () => {
  const event = {
    body: `<crater-request><client id="cc"/><items><item id="123"><responses><response /></responses></item></items></crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing response id in request!", true));
});

// TODO: add mocks for axios to test rater endpoint

test("returns a valid xml response on a good request", async () => {
  const event = {
    headers: {"Content-Type": "text/html"},
    body: "<crater-request includeRNS=\"N\">\n\t<client id=\"cc\"/>\n\t<items>\n\t  <item id=\"123\">\n\t    <responses>\n\t      <response id=\"456\">\n\t        <![CDATA[this is a test]]>\n\t      </response>\n\t    </responses>\n\t  </item>\n\t</items>\n</crater-request>"
  };

  // see https://github.com/concord-consortium/lara/blob/master/spec/libs/c_rater/api_wrapper_spec.rb#L30
  const result = await handler(event);
  const client_id = "cc";
  const item_id = "123";
  const response_id = "456";
  const score = "2";
  expect(result.statusCode).toEqual(200);
  expect(result.headers['Content-Type']).toEqual('text/xml');
  const expectedXml = `
    <crater-results>
      <tracking id="12345"/>
      <client id="${client_id}"/>
      <items>
        <item id="${item_id}">
          <responses>
            <response id="${response_id}" score="${score}" concepts="3,6" realNumberScore="2.62039"
              confidenceMeasure="0.34574">
              <advisorylist>
                <advisorycode>101</advisorycode>
              </advisorylist>
            </response>
          </responses>
        </item>
      </items>
    </crater-results>
  `;
  assertXmlMatch(result.body, expectedXml);

});

