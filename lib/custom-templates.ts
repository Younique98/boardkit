import { Template } from "@/types/template"

const STORAGE_KEY = "boardkit_custom_templates"

export function getCustomTemplates(): Template[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading custom templates:", error)
    return []
  }
}

export function saveCustomTemplate(template: Template): void {
  try {
    const existing = getCustomTemplates()
    const updated = [...existing, template]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving custom template:", error)
    throw new Error("Failed to save template")
  }
}

export function deleteCustomTemplate(id: string): void {
  try {
    const existing = getCustomTemplates()
    const updated = existing.filter((t) => t.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error deleting custom template:", error)
    throw new Error("Failed to delete template")
  }
}

export function updateCustomTemplate(template: Template): void {
  try {
    const existing = getCustomTemplates()
    const updated = existing.map((t) => (t.id === template.id ? template : t))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error updating custom template:", error)
    throw new Error("Failed to update template")
  }
}
