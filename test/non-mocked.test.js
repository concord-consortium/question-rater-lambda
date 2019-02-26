const {handler} = require("../index");
const {assertXmlMatch} = require("./test-utils");
const { authorizationValue } = require("../auth");

const headers = {
  "Content-Type": "text/html",
  Authorization: authorizationValue
};

test("returns a valid xml response on a good request to the non-mocked automl service", async () => {
  const event = {
    headers,
    body: `
      <crater-request includeRNS="N">
        <client id="cc"/>
          <items>
            <item id="1">
              <responses>
                <response id="456">
                  <![CDATA[test]]>
                </response>
              </responses>
            </item>
          </items>
        </crater-request>`
  };

  // see https://github.com/concord-consortium/lara/blob/master/spec/libs/c_rater/api_wrapper_spec.rb#L30
  const result = await handler(event);
  const client_id = "cc";
  const item_id = "1";
  const response_id = "456";
  const score = "1";
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

test("returns a valid xml response on a good request to the non-mocked azure service", async () => {
  const event = {
    headers,
    body: `
      <crater-request includeRNS="N">
        <client id="cc"/>
          <items>
            <item id="2">
              <responses>
                <response id="456">
                  <![CDATA[test]]>
                </response>
              </responses>
            </item>
          </items>
        </crater-request>`
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
