// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import App from './App';
import './index.css';

Amplify.configure(awsConfig);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
