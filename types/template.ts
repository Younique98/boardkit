export interface GitHubLabel {
  name: string;
  color: string;
  description: string;
}

export interface Issue {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
  milestone?: number;
}

export interface Phase {
  name: string;
  description: string;
  duration?: string;
  issues: Issue[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  phases: Phase[];
  labels: GitHubLabel[];
  estimatedIssues: number;
}

export interface GenerationOptions {
  templateId: string;
  repositoryOwner: string;
  repositoryName: string;
  selectedPhases?: string[];
  customLabels?: GitHubLabel[];
}
