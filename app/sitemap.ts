import type { MetadataRoute } from "next";
import { templates } from "@/lib/templates";

const BASE_URL = "https://boardkit.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/templates/create`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Every built-in template gets its own indexable detail page (see
  // app/templates/[id]/). Routes that require a signed-in session
  // (/templates/import, /templates/import-json, /templates/*/edit) are
  // intentionally left out here - they either redirect anonymous visitors
  // away or have no content until a prior step in a multi-page flow hands
  // them state, and are marked noindex at the page level instead.
  const templateRoutes: MetadataRoute.Sitemap = templates.map((template) => ({
    url: `${BASE_URL}/templates/${template.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...templateRoutes];
}
