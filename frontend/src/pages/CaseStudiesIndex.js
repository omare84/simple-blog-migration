// src/pages/CaseStudiesIndex.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function CaseStudiesIndex() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Case Studies</h1>
      <ul className="list-disc pl-5">
        <li><Link to="/case-studies/caching" className="text-indigo-600">Caching Deep Dive</Link></li>
        <li><Link to="/case-studies/image-upload" className="text-indigo-600">Image Upload Walkthrough</Link></li>
        <li><em>Search & Notifications — coming soon</em></li>
      </ul>
    </div>
  );
}
