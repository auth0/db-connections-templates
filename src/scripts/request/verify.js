async function verify(email, callback) {
  const axios = require('axios@0.22.0');

  try {
    const response = await axios.put(
      configuration.baseAPIUrl + '/users',
      { email: email },
      {
        timeout: 10000,
        headers: { 'x-api-key': configuration.apiKey }
      }
    );
    callback(null, response.data);
  } catch (e) {
    if (e.response && e.response.status === 401) return callback();
    return callback(new Error(e.message));
  }
}
