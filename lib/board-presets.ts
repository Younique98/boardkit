import { BoardColumn } from "@/types/template"

export const BOARD_PRESETS: Record<string, BoardColumn[]> = {
  kanban: [
    { name: "Todo", description: "Tasks to be done" },
    { name: "In Progress", description: "Work in progress" },
    { name: "Done", description: "Completed tasks" },
  ],
  scrum: [
    { name: "Backlog", description: "Future work" },
    { name: "To Do", description: "Sprint backlog" },
    { name: "In Progress", description: "Currently being worked on" },
    { name: "In Review", description: "Under review" },
    { name: "Done", description: "Completed in this sprint" },
  ],
}

export const BOARD_TYPE_LABELS: Record<string, string> = {
  kanban: "Kanban (Todo, In Progress, Done)",
  scrum: "Scrum (Backlog, To Do, In Progress, In Review, Done)",
  custom: "Custom (Define your own columns)",
  none: "No Project Board (Issues only)",
}
