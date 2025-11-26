import { Template } from "@/types/template"
import { getCustomTemplates } from "./custom-templates"
import ridesharePlatform from "@/data/templates/rideshare-platform.json"
import ecommercePlatform from "@/data/templates/ecommerce-platform.json"
import socialMediaApp from "@/data/templates/social-media-app.json"
import saasMvp from "@/data/templates/saas-mvp.json"
import mobileAppLaunch from "@/data/templates/mobile-app-launch.json"
import apiDevelopment from "@/data/templates/api-development.json"
import bugTracking from "@/data/templates/bug-tracking.json"
import fitnessApp from "@/data/templates/fitness-app.json"
import recipeApp from "@/data/templates/recipe-app.json"
import realEstatePlatform from "@/data/templates/real-estate-platform.json"
import jobBoard from "@/data/templates/job-board.json"
import eventManagement from "@/data/templates/event-management.json"
import learningManagement from "@/data/templates/learning-management.json"
import hotelBooking from "@/data/templates/hotel-booking.json"
import freelanceMarketplace from "@/data/templates/freelance-marketplace.json"
import personalFinance from "@/data/templates/personal-finance.json"
import telemedicine from "@/data/templates/telemedicine.json"
import restaurantManagement from "@/data/templates/restaurant-management.json"
import inventoryManagement from "@/data/templates/inventory-management.json"
import projectManagement from "@/data/templates/project-management.json"

export const templates: Template[] = [
  ridesharePlatform as Template,
  ecommercePlatform as Template,
  socialMediaApp as Template,
  fitnessApp as Template,
  recipeApp as Template,
  realEstatePlatform as Template,
  jobBoard as Template,
  eventManagement as Template,
  learningManagement as Template,
  hotelBooking as Template,
  freelanceMarketplace as Template,
  personalFinance as Template,
  telemedicine as Template,
  restaurantManagement as Template,
  inventoryManagement as Template,
  projectManagement as Template,
  saasMvp as Template,
  mobileAppLaunch as Template,
  apiDevelopment as Template,
  bugTracking as Template,
]

export function getAllTemplates(): Template[] {
  const customTemplates = getCustomTemplates()
  return [...templates, ...customTemplates]
}

export function getTemplateById(id: string): Template | undefined {
  const allTemplates = getAllTemplates()
  return allTemplates.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): Template[] {
  const allTemplates = getAllTemplates()
  return allTemplates.filter((t) => t.category === category)
}

export function getAllCategories(): string[] {
  const allTemplates = getAllTemplates()
  return Array.from(new Set(allTemplates.map((t) => t.category)))
}
