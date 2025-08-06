import React from 'react';
import AppContent from '../App';   // we’ll export this from App.js

export default function HomePage({ user }) {
  // AppContent expects both signOut and user, 
  // but our <Routes> wraps HomePage inside <Authenticator>
  // so we just forward `user` and pull signOut from context.
  // For simplicity, we’ll re-use Authenticator logic in App.js instead.
  return (
    <div>
      {/* You can also copy/paste all of AppContent here directly */}
      <AppContent user={user} />
    </div>
  );
}
