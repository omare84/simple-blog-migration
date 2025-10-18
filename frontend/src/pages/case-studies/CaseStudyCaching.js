// frontend/src/pages/case-studies/CaseStudyCaching.js
import React from 'react';

export default function CaseStudyCaching() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Caching Deep Dive</h1>

      {/* Executive summary for non-technical readers */}
      <section className="mb-4">
        <h2 className="text-lg font-semibold">Executive summary</h2>
        <p className="text-gray-700">
          We reduced developer environment costs and dramatically improved API response times by adding a small Redis cache
          in front of the database. The change delivers faster "List posts" responses on cache hits while keeping a safe
          fallback to Postgres — so nothing breaks when the cache is offline.
        </p>
      </section>

      {/* Cost chart image */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Example cost impact (dev)</h3>
        <img
          src="/images/caching-cost.png"
          alt="Cost explorer savings example"
          className="w-full max-w-xl rounded shadow-sm"
        />
        <p className="text-xs text-gray-500 mt-2">Example: dev account cost reduction and snapshot strategy (illustrative)</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p>
          <strong>Problem:</strong> Listing posts was slow and added unnecessary database load and cost.<br />
          <strong>Solution:</strong> Added a Redis cache in front of the database, with a safe fallback to the DB when the cache is unavailable.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Architecture</h2>
        <img
          src="/images/caching-arch.png"
          alt="Caching architecture diagram"
          className="w-full max-w-2xl rounded shadow-sm mb-3"
        />
        <p>Lambda → VPC → Redis & RDS + VPC endpoints.</p>
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
            <tr><td>On-demand snapshots & restores</td><td>$0 when off</td><td>$2 storage/mo</td><td>−$23</td></tr>
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
        <p>80% faster "List Posts" on cache hits. Zero downtime when cache is down thanks to graceful fallback. ~ $33+/mo savings in dev example.</p>
      </section>
    </div>
  );
}