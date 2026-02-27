// import withPWAInit from "next-pwa";

// const withPWA = withPWAInit({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
// });

// module.exports = withPWA({
//   reactStrictMode: true,
//   turbopack: {},
//   images: {
//     domains: ["images.unsplash.com", "res.cloudinary.com"],
//   },
// });

import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
  turbopack: {},
};

export default withPWA(nextConfig);