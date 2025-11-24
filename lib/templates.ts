import { Template } from "@/types/template"
import ridesharePlatform from "@/data/templates/rideshare-platform.json"
import ecommercePlatform from "@/data/templates/ecommerce-platform.json"
import socialMediaApp from "@/data/templates/social-media-app.json"
import saasMvp from "@/data/templates/saas-mvp.json"
import mobileAppLaunch from "@/data/templates/mobile-app-launch.json"
import apiDevelopment from "@/data/templates/api-development.json"
import bugTracking from "@/data/templates/bug-tracking.json"

export const templates: Template[] = [
  ridesharePlatform as Template,
  ecommercePlatform as Template,
  socialMediaApp as Template,
  saasMvp as Template,
  mobileAppLaunch as Template,
  apiDevelopment as Template,
  bugTracking as Template,
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter((t) => t.category === category)
}

export function getAllCategories(): string[] {
  return Array.from(new Set(templates.map((t) => t.category)))
}
