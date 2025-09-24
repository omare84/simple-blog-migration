// src/pages/FeaturesPage.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const services = [
    {
      title: 'Performance & Caching Audit',
      price: '$200 (audit)',
      desc:
        'Prioritized findings and 2–3 immediate fixes (CDN/TTL, DB tuning, cache rules). CLI/Terraform snippets to implement.',
      timing: '2–3 days',
    },
    {
      title: 'Serverless API / Migration (small)',
      price: '$500–$1,500',
      desc:
        'Migration plan (rehost/replatform/refactor), IaC templates, and a staging deployment + smoke tests.',
      timing: '1–3 weeks',
    },
    {
      title: 'Developer Experience / Local Dev',
      price: '$150',
      desc:
        'CRA proxy + mock-server + README and a one-hour walkthrough so your frontend devs iterate fast without redeploys.',
      timing: '1–2 days',
    },
    {
      title: 'Ongoing Infra Support / Audits',
      price: 'Hourly — $40–$60',
      desc:
        'Retainers or hourly work to implement improvements, monitoring, and manage AWS infra.',
      timing: 'Weekly or as-needed',
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-4">Services — What We do</h1>

      <p className="text-gray-700 mb-6">
        We help teams ship practical cloud fixes and improvements: migrations, performance triage, caching,
        deploy hardening, and local dev workflows. Below are typical engagements and what you get.
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
        <h2 className="text-xl mb-2">How We work</h2>
        <ol className="list-decimal pl-5 text-gray-700">
          <li>Discovery: collect artifacts (CloudWatch, Cost Explorer, repo link).</li>
          <li>Short diagnosis and quick wins (audit report + prioritized fixes).</li>
          <li>Optional implementation: IaC + deployment + tests.</li>
          <li>Handover: documentation + small runbook for your team.</li>
        </ol>
      </section>

      <div className="mt-8">
        <h3 className="text-lg">Ready to get started?</h3>
        <p className="text-sm text-gray-700 mb-3">Book a short audit or reach out with your requirements.</p>
        <a
          href="https://www.upwork.com/freelancers/~01fc1ccac3e5af5062"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Work With Us
        </a>
        <Link to="/case-studies" className="ml-3 inline-block px-4 py-2 border rounded">
          View Case Studies
        </Link>
      </div>
    </div>
  );
}
