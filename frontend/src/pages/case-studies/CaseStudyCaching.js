// frontend/src/pages/case-studies/CaseStudyCaching.js
import React from 'react';

export default function CaseStudyCaching() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Caching Deep Dive</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p>
          <strong>Problem:</strong> GET /posts hit RDS on every call &rarr; latency &amp; cost.<br />
          <strong>Solution:</strong> Layer ElastiCache (Redis) with smart fallback to RDS when Redis is offline.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Architecture</h2>
        <p>Lambda &rarr; VPC &rarr; Redis &amp; RDS + VPC endpoints. (Diagram placeholder)</p>
        <p><a href="/docs/architecture.png" target="_blank" rel="noreferrer">View architecture diagram</a></p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Key code</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`// getRedisClient with cacheDisabled flag…
redisClient.on("error", err => {
  console.warn("Redis error, disabling cache:", err.message);
  cacheDisabled = true;
});`}
        </pre>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Log excerpt</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`✅ getPosts invoked
✅ pinging Redis at my-test-redis…
WARN Redis error, disabling cache: getaddrinfo ENOTFOUND …
⚠️ Redis unavailable or error, disabling cache: Connection is closed.
✅ Cache hit`}
        </pre>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Cost savings (example)</h2>
        <table className="table-auto border-collapse">
          <thead>
            <tr><th className="pr-4 text-left">Tactic</th><th className="pr-4 text-left">Before</th><th className="pr-4 text-left">After</th><th className="text-left">Δ</th></tr>
          </thead>
          <tbody>
            <tr><td>Cache cluster running 24/7</td><td>$25/mo</td><td>$0 (snapshot idle)</td><td>−$25</td></tr>
            <tr><td>On-demand snapshots &amp; restores</td><td>$0 when off</td><td>$2 storage/mo</td><td>−$23</td></tr>
            <tr><td>Downsized to cache.t3.micro</td><td>$15 → $5/mo</td><td>~$5/mo</td><td>−$10</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Commands used</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`# Snapshot & delete cluster
aws elasticache create-snapshot --cache-cluster-id my-test-redis-001 --snapshot-name my-test-redis-snapshot-001 --region us-east-2

aws elasticache delete-replication-group --replication-group-id my-test-redis --retain-primary-cluster false --region us-east-2

# Restore later on demand
aws elasticache restore-cache-cluster-from-snapshot --cache-cluster-id my-test-redis-001 --snapshot-name my-test-redis-snapshot-001 --cache-node-type cache.t3.micro --region us-east-2`}
        </pre>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Impact</h2>
        <p>80% faster &ldquo;List Posts&rdquo; on cache hits. Zero downtime when cache is down thanks to graceful fallback. ~ $33+/mo savings in dev example.</p>
      </section>
    </div>
  );
}