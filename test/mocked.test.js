const {postViaPromise} = require("../post-via-promise");
const {handler} = require("../index");
const {assertXmlMatch, errorResult} = require("./test-utils");
const {authorizationValue} = require("../auth");

jest.mock('../post-via-promise');

const headers = { Authorization: authorizationValue };
const headersWithContentType = {
  "Content-Type": "text/html",
  Authorization: authorizationValue
}

test("fails with missing authorization header", () => {
  expect(handler({})).resolves.toEqual(errorResult("Error: Missing Authorization header!"));
});

test("fails with missing body element in event", () => {
  expect(handler({headers})).resolves.toEqual(errorResult("Error: Missing body element in lambda event!"));
});

test("fails with missing crater-request element in body", () => {
  const event = {
    headers,
    body: "<test />"
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request top level element in request!"));
});

test("fails with missing crater-request.client element in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <test />
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request.client element in request!"));
});

test("fails with missing crater-request.client id in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <client/>
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing id attribute in crater-request.client element in request!"));
});

test("fails with missing crater-request.items in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <client id="cc"/>
        <test />
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing crater-request.items element in request!", true));
});

test("fails with missing crater-request.items.item id in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <client id="cc"/>
        <items>
          <item>
            <test />
          </item>
        </items>
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing item id in request!", true));
});

test("fails with missing crater-request.items.item responses in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <client id="cc"/>
        <items>
          <item id="FUTURE_X">
            <test />
          </item>
        </items>
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing item reqsponses in request!", true));
});

test("fails with missing crater-request.items.item.responses.id in body", () => {
  const event = {
    headers,
    body: `
      <crater-request>
        <client id="cc"/>
        <items>
          <item id="FUTURE_X">
            <responses>
              <response />
            </responses>
          </item>
        </items>
      </crater-request>`
  }
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing response id in request!", true));
});

test("fails when proxied question rater endpoint doesn't return label value", () => {
  postViaPromise.mockReturnValue({});

  const event = {
    headers: headersWithContentType,
    body: `
      <crater-request includeRNS="N">
        <client id="cc"/>
        <items>
          <item id="FUTURE_X">
            <responses>
              <response id="456">
                <![CDATA[this is a test]]>
              </response>
            </responses>
          </item>
        </items>
      </crater-request>`
  };
  expect(handler(event)).resolves.toEqual(errorResult("Error: Missing label in automl question rater response!", true));
});

test("returns a valid xml response on a good request", async () => {
  postViaPromise.mockReturnValue({label: "2"});

  const event = {
    headers: headersWithContentType,
    body: `
      <crater-request includeRNS="N">
        <client id="cc"/>
        <items>
          <item id="FUTURE_X">
            <responses>
              <response id="456">
                <![CDATA[this is a test]]>
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
  assertXmlMatch(result.body, expectedXml);
});
