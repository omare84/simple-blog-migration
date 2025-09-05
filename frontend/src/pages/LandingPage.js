// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Simple Blog — Serverless on AWS</h1>
        <p className="text-gray-600">Demo of Lambda + API Gateway, RDS, Redis, S3 + CloudFront, and Cognito.</p>
        <div className="mt-4 space-x-3">
          <Link to="/blog" className="px-4 py-2 bg-indigo-600 text-white rounded">View Recent Posts</Link>
          <Link to="/case-studies" className="px-4 py-2 border rounded">Read Case Studies</Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Image Upload</h3>
          <p className="text-sm text-gray-600">Secure presigned URLs + CloudFront delivery.</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Caching</h3>
          <p className="text-sm text-gray-600">ElastiCache with fallback to RDS for resilience.</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Authentication</h3>
          <p className="text-sm text-gray-600">Cognito user pools for sign-up and sign-in.</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-3">Selected Case Studies</h2>
        <div className="space-y-4">
          <Link to="/case-studies/caching" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Caching Deep Dive</h4>
            <p className="text-sm text-gray-600">How I implemented Redis caching, logs, and cost savings.</p>
          </Link>
          <Link to="/case-studies/image-upload" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Image Upload Walkthrough</h4>
            <p className="text-sm text-gray-600">Presigned URL flow, CloudFront, and security considerations.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
