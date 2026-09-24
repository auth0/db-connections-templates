async function login(identifierValue, password, callback) {
  const axios = require('axios@0.32.0');

  try {
    const response = await axios.get(
      configuration.baseAPIUrl + '/profile',
      {
        timeout: 10000,
        headers: { 'x-api-key': configuration.apiKey },
        auth: { username: identifierValue, password: password }
      }
    );
    const user = response.data;
    callback(null, {
      user_id: user.user_id.toString(),
      nickname: user.nickname,
      email: user.email
    });
  } catch (e) {
    if (e.response && e.response.status === 401) return callback();
    return callback(new Error(e.message));
  }
}
