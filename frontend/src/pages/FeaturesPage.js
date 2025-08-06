import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const phases = [
    { n: 1, desc: 'Backend Setup (Node.js, Express, PostgreSQL)', done: true },
    { n: 2, desc: 'Blog API Development (Full CRUD)', done: true },
    { n: 3, desc: 'Database Migration (RDS, Secrets Manager)', done: true },
    { n: 4, desc: 'Frontend Development (React scaffold + UI improvements)', done: true },
    { n: 5, desc: 'Deployment to AWS (EC2, RDS, ALB)', done: true },
    { n: 6, desc: 'Deploy Frontend (S3 + CloudFront + HTTPS)', done: true },
    { n: 7, desc: 'Core Features (CRUD on UI)', done: true },
    { n: 8, desc: 'AWS-Native Enhancements (Lambda, API Gateway, CI/CD)', done: true },
    { n: 9, desc: 'UI/UX & Authentication (Cognito + styling)', done: true },
    { n: 10, desc: 'Advanced Features (Image Upload, Search, Caching, Notifications)', done: false },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Project Phases</h1>
      <ul className="list-disc pl-5">
        {phases.map((p) => (
          <li key={p.n} className="mb-2">
            {p.done ? '✅' : '🚧'} Phase {p.n}: {p.desc}
            {p.n === 10 && (
              <ul className="list-inside text-blue-600 mt-1">
                <li>
                  <Link to="/blog/cache" className="hover:underline">
                    Caching Deep Dive
                  </Link>
                </li>
                <li>
                  <Link to="/blog/image-upload" className="hover:underline">
                    Image Upload Walkthrough
                  </Link>
                </li>
                <li>
                  <em>Search & Notifications (Coming soon…)</em>
                </li>
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <h2 className="text-xl">Interested in AWS serverless work?</h2>
        <a
          href="https://www.upwork.com/…"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Let’s Talk
        </a>
      </div>
    </div>
  );
}
