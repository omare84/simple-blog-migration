const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET'
};

exports.handler = async (event) => {
  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const postId = event.pathParameters?.id;
  const extension = event.queryStringParameters?.ext || 'jpg';
  const key = `uploads/posts/${postId || 'misc'}/${uuidv4()}.${extension}`;

  const params = {
    Bucket: process.env.UPLOADS_BUCKET,
    Key: key,
    // Increase presign lifetime to 300s (5 minutes) to avoid short-window expiry
    Expires: 300,
    ContentType: event.queryStringParameters?.contentType || 'image/jpeg',
    // Important: long TTL for immutable keys
    CacheControl: 'public, max-age=31536000, immutable'
  };

  try {
    const uploadUrl = await S3.getSignedUrlPromise('putObject', params);
    const generatedAt = new Date().toISOString();

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uploadUrl, key, contentType: event.queryStringParameters?.contentType || 'image/jpeg', generated_at: generatedAt }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: 'Error generating upload URL' }),
    };
  }
};