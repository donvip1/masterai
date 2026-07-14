/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true
      },
      {
        source: "/register.html",
        destination: "/register",
        permanent: true
      },
      {
        source: "/quiz.html",
        destination: "/quiz",
        permanent: true
      },
      {
        source: "/dashboard.html",
        destination: "/dashboard",
        permanent: true
      },
      {
        source: "/offline.html",
        destination: "/offline",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          }
        ]
      },
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
