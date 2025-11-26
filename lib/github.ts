import { Octokit } from "@octokit/rest"
import { Template, GitHubLabel, Issue } from "@/types/template"

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async getUserRepos() {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      affiliation: "owner",
    })
    return data
  }

  async getExistingLabels(owner: string, repo: string): Promise<Map<string, GitHubLabel>> {
    try {
      const { data } = await this.octokit.issues.listLabelsForRepo({
        owner,
        repo,
        per_page: 100,
      })
      // Return map of label name -> label data for easy lookup
      const labelMap = new Map<string, GitHubLabel>()
      data.forEach((label) => {
        labelMap.set(label.name, {
          name: label.name,
          color: label.color,
          description: label.description || "",
        })
      })
      return labelMap
    } catch (error) {
      console.error("Error fetching existing labels:", error)
      return new Map()
    }
  }

  async createOrUpdateLabel(
    owner: string,
    repo: string,
    label: GitHubLabel,
    existingLabels: Map<string, GitHubLabel>
  ): Promise<"created" | "updated" | "unchanged"> {
    const existing = existingLabels.get(label.name)

    if (!existing) {
      // Label doesn't exist, create it
      try {
        await this.octokit.issues.createLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
          description: label.description,
        })
        return "created"
      } catch (error) {
        console.error("Error creating label:", error)
        throw error
      }
    }

    // Label exists, check if it changed
    const colorChanged = existing.color.toLowerCase() !== label.color.toLowerCase()
    const descriptionChanged = (existing.description || "") !== (label.description || "")

    if (colorChanged || descriptionChanged) {
      // Label changed, update it
      try {
        await this.octokit.issues.updateLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
          description: label.description,
        })
        return "updated"
      } catch (error) {
        console.error("Error updating label:", error)
        throw error
      }
    }

    // Label exists and hasn't changed
    return "unchanged"
  }

  async createLabel(
    owner: string,
    repo: string,
    label: GitHubLabel
  ): Promise<boolean> {
    try {
      await this.octokit.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color,
        description: label.description,
      })
      return true // Label was newly created
    } catch (error) {
      // Label might already exist
      if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
        // Update existing label
        await this.octokit.issues.updateLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
          description: label.description,
        })
        return false // Label already existed, was updated
      } else {
        throw error
      }
    }
  }

  async getExistingIssues(owner: string, repo: string): Promise<string[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: "all",
        per_page: 100,
      })
      // Return array of issue titles
      return data.map((issue) => issue.title)
    } catch (error) {
      console.error("Error fetching existing issues:", error)
      return []
    }
  }

  async createIssue(
    owner: string,
    repo: string,
    issue: Issue
  ): Promise<number> {
    // Replace literal \n with actual newlines for proper markdown formatting
    const formattedBody = issue.body.replace(/\\n/g, '\n')

    const { data } = await this.octokit.issues.create({
      owner,
      repo,
      title: issue.title,
      body: formattedBody,
      labels: issue.labels,
      assignees: issue.assignees,
    })
    return data.number
  }

  async generateBoard(
    owner: string,
    repo: string,
    template: Template,
    onProgress?: (progress: {
      phase: string
      current: number
      total: number
    }) => void
  ): Promise<{ issuesCreated: number; labelsCreated: number; labelsUpdated: number; issuesSkipped: number }> {
    let issuesCreated = 0
    let labelsCreated = 0
    let labelsUpdated = 0
    let issuesSkipped = 0

    // Step 0: Fetch existing data to avoid duplicates
    onProgress?.({
      phase: "Checking existing data",
      current: 0,
      total: 1,
    })

    const existingIssueTitles = await this.getExistingIssues(owner, repo)
    const existingLabels = await this.getExistingLabels(owner, repo)

    // Step 1: Create or update labels (only count actual changes)
    onProgress?.({
      phase: "Processing labels",
      current: 0,
      total: template.labels.length,
    })

    for (let i = 0; i < template.labels.length; i++) {
      const result = await this.createOrUpdateLabel(
        owner,
        repo,
        template.labels[i],
        existingLabels
      )

      if (result === "created") {
        labelsCreated++
      } else if (result === "updated") {
        labelsUpdated++
      }
      // If result === "unchanged", don't count it

      onProgress?.({
        phase: "Processing labels",
        current: i + 1,
        total: template.labels.length,
      })
    }

    // Step 2: Create only new issues (skip duplicates)
    const totalIssues = template.phases.reduce(
      (sum, phase) => sum + phase.issues.length,
      0
    )

    let currentIssueIndex = 0

    for (const phase of template.phases) {
      for (const issue of phase.issues) {
        currentIssueIndex++

        // Skip if issue with same title already exists
        if (existingIssueTitles.includes(issue.title)) {
          issuesSkipped++
          onProgress?.({
            phase: `Creating issues - ${phase.name}`,
            current: currentIssueIndex,
            total: totalIssues,
          })
          continue
        }

        await this.createIssue(owner, repo, issue)
        issuesCreated++
        onProgress?.({
          phase: `Creating issues - ${phase.name}`,
          current: currentIssueIndex,
          total: totalIssues,
        })

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return { issuesCreated, labelsCreated, labelsUpdated, issuesSkipped }
  }

  async verifyAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo })
      return true
    } catch {
      return false
    }
  }
}
