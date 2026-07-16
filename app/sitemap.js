import { academyData } from "../lib/academyData";

export default function sitemap() {
  const baseUrl = `https://${academyData.academy.domain}`;
  const lastModified = new Date("2026-07-15T00:00:00.000Z");

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/refunds`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
