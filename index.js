const axios = require("axios");
const {parseString, Builder} = require("xml2js");

const util = require("util");
const parseXML = util.promisify(parseString);

const getResponseResult = async (clientId, itemId, responseArray) => {
  const response = responseArray[0];
  const responseId = response.$ ? response.$.id : null;
  if (!responseId) {
    throw new Error("Missing response id in request!");
  }
  const question = response._ || "";
  if (question.length === 0) {
    throw new Error("Missing question in request!");
  }

  // TODO: send info to rating service and await response and then return score
  // const url = process.env.RATER_ENDPOINT || "???";
  // const params = {clientId, itemId, responseId, question};
  // const result = await axios.post(url, params);
  // sent result back in response...

  return {
    response: {
      $: {id: responseId, score: 2, concepts: "3,6", realNumberScore: "2.62039", confidenceMeasure: "0.34574"},
      advisorylist: {
        advisorycode: {_: "101"}
      }
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
  const builder = new Builder({headless: true, cdata: true});
  const result = {
    "crater-results": {
      tracking: {$: {id: "12345"}},
    }
  };
  const innerResult = result["crater-results"];

  try {
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
      statusCode: 400,
      body: builder.buildObject(result)
    }
  }
};