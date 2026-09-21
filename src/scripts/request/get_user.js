async function getUser(identifierValue, callback) {
  const axios = require('axios@0.32.0');

  try {
    const response = await axios.get(
      configuration.baseAPIUrl + '/users-by-email/' + identifierValue,
      {
        timeout: 10000,
        headers: { 'x-api-key': configuration.apiKey }
      }
    );
    const user = response.data;
    callback(null, {
      user_id: user.user_id.toString(),
      nickname: user.nickname,
      email: user.email
    });
  } catch (e) {
    if (e.response && e.response.status === 404) return callback(null);
    return callback(new Error(e.message));
  }
}
