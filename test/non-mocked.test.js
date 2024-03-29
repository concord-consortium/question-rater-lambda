const {handler} = require("../index");
const {assertXmlMatch, errorResult} = require("./test-utils");
const {authorizationValue} = require("../auth");

const headers = {
  "Content-Type": "text/html"
};
const headersWithAuthorization = {
  "Content-Type": "text/html",
  Authorization: authorizationValue
};

// used to prevent the test from breaking due to the score changing in the real service
const forceScoreResult = (body, score) => body.replace(/score="\d"/, `score="${score}"`);

describe("when authentication is enabled", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, AUTH_ENABLED: "true" };
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  test("returns an error when no authorization header is present", async () => {
    const event = {
      headers,
      body: `
        <crater-request includeRNS="N">
          <client id="cc"/>
            <items>
              <item id="FUTURE_X">
                <responses>
                  <response id="456">
                    <![CDATA[test]]>
                  </response>
                </responses>
              </item>
            </items>
          </crater-request>`
    };

    const result = await handler(event);
    expect(result.statusCode).toEqual(400);
    expect(result).toEqual(errorResult("Error: Missing Authorization header!"));
  });

  test("returns a valid xml response on a good request to the non-mocked automl FUTURE_X service", async () => {
    const event = {
      headers: headersWithAuthorization,
      body: `
        <crater-request includeRNS="N">
          <client id="cc"/>
            <items>
              <item id="FUTURE_X">
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
    const item_id = "FUTURE_X";
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
              <response id="${response_id}" score="${score}"/>
            </responses>
          </item>
        </items>
      </crater-results>
    `;
    assertXmlMatch(forceScoreResult(result.body, score), expectedXml);
  });
});

describe("when authentication is disabled", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, AUTH_ENABLED: "false" };
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  test("returns a valid xml response on a good request to the non-mocked automl FUTURE_X service", async () => {
    const event = {
      headers,
      body: `
        <crater-request includeRNS="N">
          <client id="cc"/>
            <items>
              <item id="FUTURE_X">
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
    const item_id = "FUTURE_X";
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
              <response id="${response_id}" score="${score}"/>
            </responses>
          </item>
        </items>
      </crater-results>
    `;
    assertXmlMatch(forceScoreResult(result.body, score), expectedXml);
  });

  test("returns a valid xml response on a good request to the non-mocked automl CARBON_X service", async () => {
    const event = {
      headers,
      body: `
        <crater-request includeRNS="N">
          <client id="cc"/>
            <items>
              <item id="CARBON_X">
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
    const item_id = "CARBON_X";
    const response_id = "456";
    const score = "0";
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
    assertXmlMatch(forceScoreResult(result.body, score), expectedXml);
  });
});
