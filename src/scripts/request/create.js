async function create(user, callback) {
  const axios = require('axios@0.32.0');

  try {
    await axios.post(
      configuration.baseAPIUrl + '/users',
      user,
      {
        timeout: 10000,
        headers: { 'x-api-key': configuration.apiKey }
      }
    );
    callback(null);
  } catch (e) {
    return callback(new Error(e.message));
  }
}
