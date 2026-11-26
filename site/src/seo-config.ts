import siteMeta from "./site-meta.json" with { type: "json" };

export const SITE_URL = (
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  siteMeta.siteUrl
).replace(/\/+$/, "");

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
  includeInSitemap?: boolean;
}

export const ROUTES_META: RouteMeta[] = siteMeta.routes as RouteMeta[];

export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  return (
    ROUTES_META.find((route) => route.path === normalized) ||
    ROUTES_META.find((route) => route.path === "/404")!
  );
}
