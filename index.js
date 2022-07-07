require('dotenv').config();

const { postViaPromise } = require("./post-via-promise");
const { parseString, Builder } = require("xml2js");

const util = require("util");
const parseXML = util.promisify(parseString);

const { authorizationValue, authorizationEnabled } = require("./auth");

const headers = {
  "Content-Type": "text/xml",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

const getResponseResult = async (clientId, itemId, responseArray) => {
  const response = responseArray[0];
  const responseId = response.$ ? response.$.id : null;
  if (!responseId) {
    throw new Error("Missing response id in request!");
  }
  const answer = response._ || "";
  if (answer.length === 0) {
    throw new Error("Missing answer in request!");
  }

  // send info to rating service and await response and then return score
  const urlTemplate = process.env.RATING_URL_TEMPLATE || "https://us-central1-esaaf-auto-score-test.cloudfunctions.net/query-auto-ml/__ITEM_ID__";
  const url = urlTemplate.replace(/__ITEM_ID__/, itemId);

  const result = await postViaPromise(url, {clientId, itemId, responseId, answer});
  if (!result || !result.hasOwnProperty("label")) {
    throw new Error("Missing label in question rater response!");
  }

  return {
    response: {
      $: {id: responseId, score: result.label},
    }
  }
}

const getItemResult = async (clientId, itemArray) => {
  const item = itemArray[0];
  const itemId = item.$ ? item.$.id : null;
  if (!itemId) {
    throw new Error("Missing item id in request!");
  }
  if (!item.responses) {
    throw new Error("Missing item responses in request!");
  }
  const responses = await Promise.all(item.responses.map((response) => getResponseResult(clientId, itemId, response.response)));

  return {
    item: {$: {id: itemId}, responses}
  }
}

exports.handler = async (event) => {
  let errorStatusCode = 400;

  const builder = new Builder({headless: true, cdata: true});
  const result = {
    "crater-results": {
      tracking: {$: {id: "12345"}},
    }
  };
  const innerResult = result["crater-results"];

  try {
    if (authorizationEnabled()) { // authorization is optional now, and most likely will be disabled in production env
      if (!event.headers || !event.headers.Authorization) {
        throw new Error("Missing Authorization header!");
      }

      if (event.headers.Authorization !== authorizationValue) {
        errorStatusCode = 401;
        throw new Error("Invalid username or password!");
      }
    }

    if (!event.body) {
      throw new Error("Missing body element in lambda event!");
    }
    const xml = await parseXML(event.body);

    if (!xml["crater-request"]) {
      throw new Error("Missing crater-request top level element in request!");
    }
    if (!xml["crater-request"].client) {
      throw new Error("Missing crater-request.client element in request!");
    }
    const clientId = xml['crater-request'].client[0].$ ? xml['crater-request'].client[0].$.id : null;
    if (!clientId) {
      throw new Error("Missing id attribute in crater-request.client element in request!");
    }
    innerResult.client = {$: {id: clientId}};

    if (!xml["crater-request"].items) {
      throw new Error("Missing crater-request.items element in request!");
    }
    const itemsArray = xml["crater-request"].items;

    innerResult.items = await Promise.all(itemsArray.map((item) => getItemResult(clientId, item.item)))

    return {
      statusCode: 200,
      headers,
      body: builder.buildObject(result)
    }
  }
  catch (e) {
    // log error if not in Jest test so it shows in the CloudWatch logs
    if (!process.env.JEST_WORKER_ID) {
      console.error(e.toString());
    }
    innerResult.error = {$: {code: errorStatusCode}, _: e.toString()};
    return {
      statusCode: errorStatusCode,
      headers,
      body: builder.buildObject(result)
    }
  }
};
