import { academyData } from "../lib/academyData";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/dashboard", "/quiz", "/offline"]
      }
    ],
    sitemap: `https://${academyData.academy.domain}/sitemap.xml`,
    host: `https://${academyData.academy.domain}`
  };
}
