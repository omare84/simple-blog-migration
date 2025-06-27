const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const postId = event.pathParameters?.id;
  const extension = event.queryStringParameters?.ext || 'jpg';
  const key = `posts/${postId || 'misc'}/${uuidv4()}.${extension}`;

  const params = {
    Bucket: process.env.UPLOADS_BUCKET,
    Key: key,
    Expires: 60,
    ContentType: event.queryStringParameters?.contentType || 'image/jpeg',
  };

  try {
    const uploadUrl = await S3.getSignedUrlPromise('putObject', params);
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl, key }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error generating upload URL' };
  }
};
