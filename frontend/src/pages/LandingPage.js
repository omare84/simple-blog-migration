// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">ScalableDeploy</h1>
        <p className="text-xl text-gray-700 mb-2">Serverless on AWS — practical, cost-efficient engineering</p>
        <p className="text-gray-600 max-w-2xl mx-auto">
          I build and operate small-to-medium production systems on AWS: serverless APIs, RDS-backed apps,
          Redis caching, CI/CD and CloudFront delivery. Real improvements — lower latency, predictable costs,
          and repeatable infrastructure.
        </p>

        <div className="mt-6 space-x-3">
          <Link to="/blog" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            View Recent Posts
          </Link>
          <Link to="/case-studies" className="px-4 py-2 border rounded hover:shadow">
            Read Case Studies
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Image Upload</h3>
          <p className="text-sm text-gray-600">Secure presigned URLs + CloudFront delivery for performant media.</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Caching</h3>
          <p className="text-sm text-gray-600">ElastiCache (Redis) with graceful fallback to RDS for resilience.</p>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Authentication</h3>
          <p className="text-sm text-gray-600">Cognito user pools for sign-up, sign-in, and secure access control.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-3">Selected Case Studies</h2>
        <div className="space-y-4">
          <Link to="/case-studies/caching" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Caching Deep Dive</h4>
            <p className="text-sm text-gray-600">Redis caching with RDS fallback — measurable latency and cost savings.</p>
          </Link>
          <Link to="/case-studies/image-upload" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">Image Upload Walkthrough</h4>
            <p className="text-sm text-gray-600">Presigned URL flow, CloudFront configuration, and security notes.</p>
          </Link>
          <Link to="/case-studies/vpc-endpoint-cost" className="block p-4 border rounded hover:shadow">
            <h4 className="font-semibold">VPC Endpoint Cost Optimization</h4>
            <p className="text-sm text-gray-600">Small infra change, clear cost impact — ideal dev-environment optimization.</p>
          </Link>
        </div>
      </section>

      <section className="bg-white shadow rounded p-6">
        <h3 className="text-lg font-semibold mb-2">Need help with your AWS stack?</h3>
        <p className="text-sm text-gray-700 mb-4">
          I offer short audits (prioritized fixes) and implementation work. Typical wins: CloudFront invalidation,
          caching, cost optimizations, and safer deploy pipelines.
        </p>
        <div className="flex space-x-3">
          <a
            href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Hire Me
          </a>
          <Link to="/case-studies" className="px-4 py-2 border rounded">
            Explore Case Studies
          </Link>
        </div>
      </section>
    </div>
  );
}
