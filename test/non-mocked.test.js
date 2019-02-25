const {handler} = require("../index");
const {assertXmlMatch} = require("./test-utils");
const { authorizationValue } = require("../auth");

const headers = {
  "Content-Type": "text/html",
  Authorization: authorizationValue
};

test("returns a valid xml response on a good request to the non-mocked service", async () => {
  const event = {
    headers,
    body: "<crater-request includeRNS=\"N\">\n\t<client id=\"cc\"/>\n\t<items>\n\t  <item id=\"2\">\n\t    <responses>\n\t      <response id=\"456\">\n\t        <![CDATA[test]]>\n\t      </response>\n\t    </responses>\n\t  </item>\n\t</items>\n</crater-request>"
  };

  // see https://github.com/concord-consortium/lara/blob/master/spec/libs/c_rater/api_wrapper_spec.rb#L30
  const result = await handler(event);
  const client_id = "cc";
  const item_id = "2";
  const response_id = "456";
  const score = "4";
  expect(result.statusCode).toEqual(200);
  expect(result.headers['Content-Type']).toEqual('text/xml');
  const expectedXml = `
    <crater-results>
      <tracking id="12345"/>
      <client id="${client_id}"/>
      <items>
        <item id="${item_id}">
          <responses>
            <response id="${response_id}" score="${score}"/>
          </responses>
        </item>
      </items>
    </crater-results>
  `;
  assertXmlMatch(result.body, expectedXml);
});
