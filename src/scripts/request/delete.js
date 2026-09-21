async function remove(id, callback) {
  const axios = require('axios@0.22.0');

  try {
    await axios.delete(
      configuration.baseAPIUrl + '/users/' + id,
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
