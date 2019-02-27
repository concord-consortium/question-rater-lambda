
exports.itemMap = {
  FUTURE_X: {
    type: "automl",
    url: "https://us-central1-esaaf-auto-score-test.cloudfunctions.net/query-auto-ml/FUTURE_X",
  },
  CARBON_X: {
    type: "automl",
    url: "https://us-central1-esaaf-auto-score-test.cloudfunctions.net/query-auto-ml/CARBON_X",
  },
  // use FUTURE_R for testing Azure even though it isn't the right model
  FUTURE_R: {
    type: "azure",
    url: "https://ussouthcentral.services.azureml.net/workspaces/b5a5025f397d41c981a3b74d5cd1ad0a/services/08f14473eb02419e90172079a51a8f9d/execute?api-version=2.0",
    bearerToken: process.env.AZURE_Q2_API_TOKEN,
  }
}