
exports.itemMap = {
  1: {
    type: "automl",
    url: "https://us-central1-esaaf-auto-score-test.cloudfunctions.net/getPrediction",
  },
  2: {
    type: "azure",
    url: "https://ussouthcentral.services.azureml.net/workspaces/b5a5025f397d41c981a3b74d5cd1ad0a/services/08f14473eb02419e90172079a51a8f9d/execute?api-version=2.0",
    bearerToken: process.env.AZURE_Q2_API_TOKEN,
  }
}
