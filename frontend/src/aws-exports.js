// src/aws-exports.js

const awsConfig = {
    Auth: {
      // This nested “Cognito” block is what v6 AuthClass expects:
      Cognito: {
        // REQUIRED
        userPoolId:         'us-east-2_wTxaWQTv5',
        userPoolClientId:   '3rbcu6ap34muuh8jl0cvnsf8pj',
  
        // Optional but recommended for password flow:
        //authenticationFlowType: 'USER_PASSWORD_AUTH',
        // You can enforce email verification here if you like:
        // signUpVerificationMethod: 'code',
  
        // What fields can users log in with:
        loginWith: {
          username: true,
          email:    true,
          phone:    false,
  
          // This nested oauth object powers the Hosted UI flow:
          oauth: {
            domain:           'us-east-2wtxawqtv5.auth.us-east-2.amazoncognito.com',
            scope:            ['email','openid','profile'],
            redirectSignIn:   'http://localhost:3000/',
            redirectSignOut:  'http://localhost:3000/',
            responseType:     'code',
          },
        },
      },
    },
  };
  
  export default awsConfig;
  