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

  async createLabel(
    owner: string,
    repo: string,
    label: GitHubLabel
  ): Promise<void> {
    try {
      await this.octokit.issues.createLabel({
        owner,
        repo,
        name: label.name,
        color: label.color,
        description: label.description,
      })
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
  ): Promise<{ issuesCreated: number; labelsCreated: number; issuesSkipped: number }> {
    let issuesCreated = 0
    let labelsCreated = 0
    let issuesSkipped = 0

    // Step 0: Fetch existing issues to avoid duplicates
    onProgress?.({
      phase: "Checking existing issues",
      current: 0,
      total: 1,
    })

    const existingIssueTitles = await this.getExistingIssues(owner, repo)

    // Step 1: Create all labels
    onProgress?.({
      phase: "Creating labels",
      current: 0,
      total: template.labels.length,
    })

    for (let i = 0; i < template.labels.length; i++) {
      await this.createLabel(owner, repo, template.labels[i])
      labelsCreated++
      onProgress?.({
        phase: "Creating labels",
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

    return { issuesCreated, labelsCreated, issuesSkipped }
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
