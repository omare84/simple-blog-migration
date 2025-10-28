// frontend/src/pages/case-studies/image-upload.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function ImageUpload() {
  // public images path
  const base = '/assets/case-studies/image-upload';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/case-studies" className="underline">← Case Studies</Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Image Upload Pipeline — signed uploads, thumbnails & CDN caching</h1>
        <p className="text-gray-600">How we built a secure, scalable image pipeline (presigned S3 uploads + Lambda thumbnails + CloudFront caching) to reduce bytes, lower cost, and improve LCP.</p>
      </header>

      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Problem</h2>
        <p className="text-gray-700">
          Image-heavy pages are often the biggest contributor to slow loads and high bandwidth bills.
          Marketplaces and classifieds need user uploads (many images) but also need those images delivered fast and cheaply.
        </p>
      </section>

      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Solution overview</h2>
        <ol className="list-decimal list-inside text-gray-700 space-y-2">
          <li>Client requests a presigned S3 PUT URL from API.</li>
          <li>Browser uploads image directly to S3 using the presigned URL.</li>
          <li>S3 `putObject` triggers a thumbnail Lambda which writes optimized sizes back to S3 and sets `Cache-Control`.</li>
          <li>CloudFront serves `/uploads/*` with a cache policy that forwards minimal headers and uses long TTLs.</li>
        </ol>
      </section>

      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Key code & config snippets</h2>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Presigned PUT (backend snippet)</div>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
{`const params = {
  Bucket: process.env.UPLOADS_BUCKET,
  Key: key,
  Expires: 300,
  ContentType: contentType
};
const uploadUrl = s3.getSignedUrl('putObject', params);`}
          </pre>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Thumbnail S3 → Lambda (concept)</div>
          <p className="text-gray-700">
            S3 object created → Lambda resizes to multiple widths (e.g. 400px, 800px) → writes back to S3 with <code>Cache-Control: public, max-age=31536000, immutable</code>.
          </p>
        </div>
      </section>

      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Before / After (examples)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <figure className="bg-gray-50 p-3 rounded">
            <img src={`${base}/lighthouse-before.png`} alt="Lighthouse before" className="w-full object-contain rounded" />
            <figcaption className="text-xs text-gray-600 mt-2">Before: LCP & total image bytes (screenshot)</figcaption>
          </figure>

          <figure className="bg-gray-50 p-3 rounded">
            <img src={`${base}/lighthouse-after.png`} alt="Lighthouse after" className="w-full object-contain rounded" />
            <figcaption className="text-xs text-gray-600 mt-2">After: LCP improved after thumbnails + CloudFront</figcaption>
          </figure>
        </div>

        <p className="text-gray-500 text-sm mt-3">If images are missing, add sample screenshots to <code>/public/assets/case-studies/image-upload/</code>.</p>
      </section>

      <section className="mb-8 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Operational notes & deliverables</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Presigned S3 uploads (secure, client-side PUT).</li>
          <li>Thumbnail Lambda triggered by S3 putObject.</li>
          <li>CloudFront cache policy for <code>/uploads/*</code> with long TTLs and no forwarded headers.</li>
          <li>Deliverables: working pipeline, before/after Lighthouse screenshots, README with deploy steps.</li>
        </ul>
      </section>

      <section className="mb-12 bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-3">Want this for your site?</h2>
        <p className="text-gray-700 mb-4">I offer a small audit + quick implementation packages to add this pipeline to your app. Typical packages: Starter ($150), Standard with thumbnails ($450), Advanced with monitoring ($900).</p>
        <div>
          <a href="/contact" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Request Audit</a>
        </div>
      </section>
    </div>
  );
}
