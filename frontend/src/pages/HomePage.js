// frontend/src/pages/HomePage.js
import React from 'react';
import { AppContent } from '../App'; // <-- named import (NOT default)

/**
 * HomePage simply forwards user + signOut into AppContent (the real home UI).
 * Avoid importing the default App here — that would render the whole app recursively.
 */
export default function HomePage({ user, signOut }) {
  return (
    <div>
      <AppContent user={user} signOut={signOut} />
    </div>
  );
}
