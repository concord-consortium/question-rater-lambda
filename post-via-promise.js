const request = require("request");

exports.postViaPromise = (url, body, config) => {
  return new Promise((resolve, reject) => {
    const options = {url, body, json: true};
    if (config && config.headers) {
      options.headers = config.headers;
    }
    request.post(options, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve(response.body);
    })
  });
};

