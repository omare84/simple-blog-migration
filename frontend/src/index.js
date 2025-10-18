// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports'; // adjust path if needed

import App from './App';
import './index.css';

// Normalize custom awsConfig -> Amplify expected shape (keeps compatibility)
function normalizeAwsConfig(cfg) {
  if (!cfg) return cfg;
  if (cfg.Auth && (cfg.Auth.userPoolId || cfg.Auth.userPoolWebClientId || cfg.Auth.userPoolClientId)) {
    return cfg;
  }
  const cogn = cfg.Auth && cfg.Auth.Cognito ? cfg.Auth.Cognito : null;
  if (cogn) {
    const mapped = {
      Auth: {
        userPoolId: cogn.userPoolId,
        userPoolWebClientId: cogn.userPoolClientId || cogn.userPoolWebClientId,
        region: cogn.region || cfg.region || undefined,
      },
    };
    const oauth = cogn.loginWith && cogn.loginWith.oauth ? cogn.loginWith.oauth : null;
    if (oauth) {
      mapped.Auth.oauth = {
        domain: oauth.domain,
        scope: oauth.scope,
        redirectSignIn: oauth.redirectSignIn,
        redirectSignOut: oauth.redirectSignOut,
        responseType: oauth.responseType,
      };
    }
    return mapped;
  }
  return cfg;
}

Amplify.configure(normalizeAwsConfig(awsConfig));

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
