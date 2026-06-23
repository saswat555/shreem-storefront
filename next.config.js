const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL

let backendImagePattern = []

if (BACKEND_URL) {
  try {
    const backend = new URL(BACKEND_URL)

    backendImagePattern = [
      {
        protocol: backend.protocol.replace(":", ""),
        hostname: backend.hostname,
        port: backend.port,
      },
    ]
  } catch (error) {
    backendImagePattern = []
  }
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "www.shreemfarms.in",
      },
      {
        protocol: "https",
        hostname: "shreemfarms.in",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      ...backendImagePattern,
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(self), payment=(self), browsing-topics=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob: https:",
          "connect-src 'self' https://shreemfarms.in https://www.shreemfarms.in https://*.razorpay.com https://api.razorpay.com https://accounts.google.com https://www.google-analytics.com https://region1.google-analytics.com https://static.cloudflareinsights.com",
          "frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com",
          "worker-src 'self' blob:",
          "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
          "upgrade-insecure-requests",
        ].join("; "),
      },
    ]

    const longCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ]

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/_next/image",
        headers: longCacheHeaders,
      },
      {
        source: "/shreem-scenes/:path*",
        headers: longCacheHeaders,
      },
      {
        source: "/:asset(gauri|mayur|logo).:ext(jpg|jpeg|png)",
        headers: longCacheHeaders,
      },
      {
        source: "/favicon.ico",
        headers: longCacheHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "shreemfarms.in",
          },
        ],
        destination: "https://www.shreemfarms.in/:path*",
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
