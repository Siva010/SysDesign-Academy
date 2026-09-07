/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * Every page in this application is prerendered at build time: each dynamic route has a
   * generateStaticParams, the one route handler is force-static, and nothing reads cookies,
   * headers or search params on the server. So the whole site exports to plain files.
   *
   * That is a deliberate property rather than a coincidence. It means the site can be served
   * from a CDN with no origin, no server runtime and no cold starts, and the only stateful
   * thing in the product - a learner's progress - lives in their own browser.
   */
  output: 'export',

  /*
   * Static hosts serve /lessons/foo/index.html for /lessons/foo. Emitting directories with
   * trailing slashes makes the built output match what the host expects, so links resolve
   * identically in local preview and in production.
   */
  trailingSlash: true,

  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['minisearch'],
  },
};

export default nextConfig;
