// src/pages/case-studies/CachingDeepDive.js
import React from 'react';

export default function CachingDeepDive() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Caching Deep Dive</h1>
      <p className="mb-4">This page will contain logs, cost screenshots and the CLI commands used to manage ElastiCache and verify cache hit/miss behavior.</p>

      <h2 className="text-xl font-semibold mt-6">Key commands</h2>
      <pre className="bg-gray-100 p-3 rounded mt-2 break-all">
{`# restore from snapshot
aws elasticache create-replication-group --replication-group-id my-test-redis --snapshot-name my-test-redis-snapshot-001 --cache-node-type cache.t3.micro --engine redis --engine-version 7.1 --num-node-groups 1 --replicas-per-node-group 0 --cache-subnet-group-name my-redis-subnet-group --security-group-ids sg-089592c4ab79e59f3 --region us-east-2

# test cache:
Invoke-RestMethod -Method Get -Uri 'https://<api>/prod/api/posts' -Headers @{ Authorization = "Bearer $jwt" }
# check CloudWatch logs for Cache miss / Cache hit
`}
      </pre>

      <p className="mt-6">Add screenshots under <code>public/case-studies/</code> and reference them here using &lt;img /&gt; tags.</p>
    </div>
  );
}
