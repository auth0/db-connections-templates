function changePassword(callback) {
  // THIS IS NOT A REAL TEMPLATE
  // This template is used for testing dependencies against a specific Node version
  require('bcrypt');
  require('crypto');
  // mongodb@5.x requires Node 14+ (uses nullish coalescing and other ES2020 syntax)
  if (parseInt(process.version.slice(1)) >= 14) {
    require('mongodb').MongoClient;
  }
  require('mysql');
  require('pg');
  require('axios');
  require('tedious');
  return callback(null, {});
}
