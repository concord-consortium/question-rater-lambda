require('dotenv').config();

const { postViaPromise } = require("./post-via-promise");
const { parseString, Builder } = require("xml2js");

const util = require("util");
const parseXML = util.promisify(parseString);

const { itemMap } = require("./item-map");

const { authorizationValue } = require("./auth");

const endPoints = {
  automl: {
    request: (item, params) => {
      return {
        params
      }
    },
    response: (result) => {
      if (!result || !result.hasOwnProperty("label")) {
        throw new Error("Missing label in automl question rater response!");
      }
      return {
        score: result.label
      }
    },
  },
  azure: {
    request: (item, params) => {
      const {answer} = params;
      return {
        params: {
          "Inputs": {
            "input1": {
              "ColumnNames": [
                "answer"
              ],
              "Values": [
                [
                  answer
                ]
              ]
            }
          },
          "GlobalParameters": {}
        },
        config: {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${item.bearerToken}`
          }
        }
      }
    },
    response: (result) => {
      if (!result || !result.Results || !result.Results.output1 || !result.Results.output1.value || !result.Results.output1.value.Values || !result.Results.output1.value.Values[0]) {
        throw new Error("Invalid response format for azure question rater response!");
      }
      const score = result.Results.output1.value.Values[0].pop();
      return {
        score
      }
    }
  }
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
  const item = itemMap[itemId];
  if (!item) {
    throw new Error(`No endpoint defined for item ${itemId}`);
  }
  const {type, url} = item;
  if (!type || !url) {
    throw new Error(`No type or url defined for item ${itemId}`);
  }
  const endPoint = endPoints[type];
  if (!endPoint) {
    throw new Error(`No endpoint defined for ${type} item type`);
  }
  const {params, config} = endPoint.request(item, {clientId, itemId, responseId, answer})
  const {score} = endPoint.response(await postViaPromise(url, params, config));

  return {
    response: {
      $: {id: responseId, score},
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
    throw new Error("Missing item reqsponses in request!");
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
    if (!event.headers || !event.headers.Authorization) {
      throw new Error("Missing Authorization header!");
    }

    if (event.headers.Authorization !== authorizationValue) {
      errorStatusCode = 401;
      throw new Error("Invalid username or password!");
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
      headers: {
        "Content-Type": "text/xml"
      },
      body: builder.buildObject(result)
    }
  }
  catch (e) {
    innerResult.error = {_: e.toString()};
    return {
      statusCode: errorStatusCode,
      body: builder.buildObject(result)
    }
  }
};
