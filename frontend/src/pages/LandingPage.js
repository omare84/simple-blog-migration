// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">ScalableDeploy</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Serverless & cloud-first solutions on AWS - practical fixes that cut cost, improve performance,
          and speed up development.
        </p>

        {/* CTA buttons: stacked on small screens, inline on md+ */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/blog"
            className="w-full sm:w-auto text-center px-5 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            aria-label="View recent posts"
          >
            View Recent Posts
          </Link>

          <Link
            to="/case-studies"
            className="w-full sm:w-auto text-center px-5 py-2 border rounded hover:shadow"
            aria-label="Read case studies"
          >
            Read Case Studies
          </Link>
        </div>
      </header>

      {/* What We Build */}
      <section className="mb-8 bg-white shadow-sm rounded p-5">
        <h2 className="text-xl font-semibold mb-2">What We Build</h2>
        <p className="text-gray-700 mb-3">
          We help small teams and startups fix the problems that waste time and money — faster APIs,
          simpler deploys, safer uploads, and targeted cost reductions.
        </p>

        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Fast, reliable serverless APIs</li>
          <li>Secure uploads + CDN delivery</li>
          <li>Caching to reduce latency and DB load</li>
          <li>Deploy pipelines and cost-efficient infra design</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-3">Selected Case Studies</h2>
        <div className="space-y-4">
          <Link to="/case-studies/caching" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Caching Deep Dive</h4>
            <p className="text-sm text-gray-600">How Redis caching reduced latency and cut dev costs.</p>
          </Link>

          <Link to="/case-studies/image-upload" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Image Upload Walkthrough</h4>
            <p className="text-sm text-gray-600">Presigned URL flow, secure uploads, and CloudFront delivery.</p>
          </Link>

          <Link to="/case-studies/vpc-endpoint" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">VPC Endpoint Cost Optimization</h4>
            <p className="text-sm text-gray-600">Small infra change, clear cost impact — ideal for dev environments.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
