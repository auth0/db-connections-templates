const scripts = require('./dbscripts.json');
require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

(async function () {
  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET || !process.env.S3_REGION || !process.env.S3_BUCKET) {
    console.log('AWS S3 settings missing. S3_ACCESS_KEY, S3_SECRET, S3_REGION and S3_BUCKET settings are required.');
    process.exit(1);
  }

  console.log(`Deploying dbscripts.json into ${process.env.S3_BUCKET} bucket...`);

  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET,
      sessionToken: process.env.S3_SESSION_TOKEN,
    },
    region: process.env.S3_REGION,
  });

  const params = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Body: JSON.stringify(scripts),
    Key: 'dbscripts/dbscripts.json',
    ContentType: 'application/json'
  });

  try {
    await s3.send(params);
    console.log('dbscripts.json deployed successfully.');
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();
