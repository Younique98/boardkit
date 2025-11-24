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
  ): Promise<{ issuesCreated: number; labelsCreated: number }> {
    let issuesCreated = 0
    let labelsCreated = 0

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

    // Step 2: Create all issues across phases
    const totalIssues = template.phases.reduce(
      (sum, phase) => sum + phase.issues.length,
      0
    )

    let currentIssueIndex = 0

    for (const phase of template.phases) {
      for (const issue of phase.issues) {
        await this.createIssue(owner, repo, issue)
        issuesCreated++
        currentIssueIndex++
        onProgress?.({
          phase: `Creating issues - ${phase.name}`,
          current: currentIssueIndex,
          total: totalIssues,
        })

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return { issuesCreated, labelsCreated }
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
