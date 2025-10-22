// src/pages/FeaturesPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const services = [
    {
      title: 'Image Pipeline & CDN Optimization',
      price: 'Starter $150 • Standard $450 • Advanced $900',
      desc:
        'Signed S3 uploads, automated Lambda thumbnails, and CloudFront cache policy so images load from the edge (faster LCP) and lower bandwidth costs. Deliverables: pipeline, before/after Lighthouse screenshots, README.',
      timing: '2–7 days',
    },
    {
      title: '48-Hour Top-5 AWS Cost Audit',
      price: '$79 / Detailed: $350',
      desc:
        'Quick focused audit of billing + infra to find 2–3 immediate cost wins (rightsizing, idle resources, CloudFront/S3 optimizations). CLI/CloudFormation snippets and prioritized roadmap included.',
      timing: '48 hours',
    },
    {
      title: 'Performance & Caching Audit',
      price: '$200 (audit)',
      desc:
        'Prioritized findings and 2–3 practical fixes (CDN/TTL, image thumbnails, API caching). Includes test checklist and deployable snippets.',
      timing: '2–3 days',
    },
    {
      title: 'Serverless API & Migration (small)',
      price: '$500–$1,500',
      desc:
        'Move endpoints to Lambda/API Gateway or containerize where appropriate. Includes migration plan, IaC templates (SAM/CloudFormation), and a staging deploy + smoke tests.',
      timing: '1–3 weeks',
    },
    {
      title: 'Developer Experience / Local Dev',
      price: '$150',
      desc:
        'CRA proxy + mock-server + README and a one-hour walkthrough so frontend devs iterate locally without redeploys. Great for onboarding and faster QA cycles.',
      timing: '1–2 days',
    },
    {
      title: 'Ongoing Infra Support / Retainer',
      price: 'Hourly — $40–$60',
      desc:
        'Short-term retainers or hourly blocks for monitoring, incident triage, cost optimization, and feature rollouts. Regular reports and low-friction handoffs.',
      timing: 'Weekly or as-needed',
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-4">Services — What we do</h1>

      <p className="text-gray-700 mb-6">
        We help teams ship practical, low-risk cloud improvements: fast image delivery, cost & hosting audits,
        serverless APIs, and developer workflows that reduce deployment friction. Below are repeatable engagements
        that deliver measurable results.
      </p>

      <div className="grid gap-6">
        {services.map((s) => (
          <div key={s.title} className="p-4 border rounded bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Price</div>
                <div className="font-medium">{s.price}</div>
                <div className="text-xs text-gray-400 mt-1">{s.timing}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-xl mb-2">How we work</h2>
        <ol className="list-decimal pl-5 text-gray-700">
          <li>Discovery: collect artifacts (CloudWatch, Cost Explorer, repo link) and define goals.</li>
          <li>Short diagnosis: quick wins, priority list, and an implementation plan.</li>
          <li>Implement: IaC + tests + smoke validation (or hand off with a runbook).</li>
          <li>Handover: documentation, monitoring tips, and a short validation checklist.</li>
        </ol>
      </section>

      <div className="mt-8">
        <h3 className="text-lg">Ready to get started?</h3>
        <p className="text-sm text-gray-700 mb-3">Pick an audit or package and we’ll provide a clear, low-risk plan to deliver results.</p>
        <a
          href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Hire Us on Upwork
        </a>
        <Link to="/case-studies" className="ml-3 inline-block px-4 py-2 border rounded">
          View Case Studies
        </Link>
      </div>
    </div>
  );
}
