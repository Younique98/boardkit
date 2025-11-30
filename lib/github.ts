import { Octokit } from "@octokit/rest"
import { Template, GitHubLabel, Issue, BoardConfiguration } from "@/types/template"

// GraphQL response types
interface RepositoryQueryResult {
  repository: {
    id: string
    owner: {
      id: string
      login: string
    }
  }
}

interface CreateProjectResult {
  createProjectV2: {
    projectV2: {
      id: string
      number: number
      url: string
    }
  }
}

interface CreateFieldResult {
  createProjectV2Field: {
    projectV2Field: {
      id: string
      name: string
      options: Array<{
        id: string
        name: string
      }>
    }
  }
}

interface ProjectFieldsQueryResult {
  node: {
    fields: {
      nodes: Array<{
        id: string
        name: string
        options?: Array<{
          id: string
          name: string
        }>
      }>
    }
  }
}

interface CreateFieldOptionResult {
  createProjectV2FieldOption: {
    projectV2FieldOption: {
      id: string
      name: string
    }
  }
}

interface IssueQueryResult {
  repository: {
    issue: {
      id: string
    }
  }
}

interface AddItemResult {
  addProjectV2ItemById: {
    item: {
      id: string
    }
  }
}

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
    boardConfig?: BoardConfiguration
  ): Promise<{
    issuesCreated: number
    labelsCreated: number
    labelsUpdated: number
    issuesSkipped: number
    projectUrl?: string
  }> {
    let issuesCreated = 0
    let labelsCreated = 0
    let labelsUpdated = 0
    let issuesSkipped = 0

    // Fetch existing data to avoid duplicates
    const existingIssueTitles = await this.getExistingIssues(owner, repo)
    const existingLabels = await this.getExistingLabels(owner, repo)

    // Step 1: Create or update labels
    for (let i = 0; i < template.labels.length; i++) {
      try {
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
      } catch (error) {
        // Silently skip labels that already exist or can't be created
        // This is fine - user might be reusing an existing repo
      }
    }

    // Step 2: Create issues and track them for board organization
    const createdIssues: Array<{ number: number; phaseName: string }> = []

    for (const phase of template.phases) {
      for (const issue of phase.issues) {
        // Skip if issue with same title already exists
        if (existingIssueTitles.includes(issue.title)) {
          issuesSkipped++
          continue
        }

        try {
          const issueNumber = await this.createIssue(owner, repo, issue)
          issuesCreated++
          createdIssues.push({ number: issueNumber, phaseName: phase.name })
        } catch (error) {
          issuesSkipped++
          // Silently skip issues that can't be created
          // This is fine - user might be reusing an existing repo
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Step 3: Create project board if requested
    let projectUrl: string | undefined

    console.log("=== BOARD CONFIG DEBUG ===")
    console.log("boardConfig received:", boardConfig)
    console.log("boardConfig?.enabled:", boardConfig?.enabled)
    console.log("boardConfig?.columns:", boardConfig?.columns)
    console.log("boardConfig?.columns.length:", boardConfig?.columns?.length)
    console.log("Will create board?:", boardConfig?.enabled && boardConfig.columns.length > 0)
    console.log("========================")

    if (boardConfig?.enabled && boardConfig.columns.length > 0) {
      try {
        console.log("Creating project board with config:", {
          boardName: boardConfig.boardName,
          columns: boardConfig.columns,
          phaseMapping: boardConfig.phaseMapping,
          createdIssuesCount: createdIssues.length
        })
        projectUrl = await this.createProjectBoard(
          owner,
          repo,
          template,
          boardConfig,
          createdIssues
        )
        console.log("Project board created successfully:", projectUrl)
      } catch (error) {
        console.error("Error creating project board:", error)
        if (error instanceof Error) {
          console.error("Error message:", error.message)
          console.error("Error stack:", error.stack)
        }
        // Don't fail the entire operation if board creation fails
      }
    }

    return { issuesCreated, labelsCreated, labelsUpdated, issuesSkipped, projectUrl }
  }

  private async createProjectBoard(
    owner: string,
    repo: string,
    template: Template,
    boardConfig: BoardConfiguration,
    createdIssues: Array<{ number: number; phaseName: string }>
  ): Promise<string> {
    console.log(`[createProjectBoard] Starting for ${owner}/${repo}`)
    console.log(`[createProjectBoard] Board name: ${boardConfig.boardName}`)
    console.log(`[createProjectBoard] Columns:`, boardConfig.columns)
    console.log(`[createProjectBoard] Created issues count:`, createdIssues.length)

    // Step 1: Get repository and owner node IDs
    const repoQuery = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
          owner {
            id
            login
          }
        }
      }
    `

    const repoResult = await this.octokit.graphql<RepositoryQueryResult>(repoQuery, { owner, repo })
    const ownerId = repoResult.repository.owner.id
    console.log(`[createProjectBoard] Got owner ID: ${ownerId}`)

    // Step 2: Create the project
    const createProjectMutation = `
      mutation($ownerId: ID!, $title: String!) {
        createProjectV2(input: { ownerId: $ownerId, title: $title }) {
          projectV2 {
            id
            number
            url
          }
        }
      }
    `

    const projectResult = await this.octokit.graphql<CreateProjectResult>(createProjectMutation, {
      ownerId,
      title: boardConfig.boardName || `${template.name} Board`,
    })

    const projectId = projectResult.createProjectV2.projectV2.id
    const projectUrl = projectResult.createProjectV2.projectV2.url
    console.log(`[createProjectBoard] Created project: ${projectUrl}`)

    // Step 3: Query for the built-in Status field
    const getFieldsQuery = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    const fieldsResult = await this.octokit.graphql<ProjectFieldsQueryResult>(getFieldsQuery, { projectId })
    const statusField = fieldsResult.node.fields.nodes.find((field) => field.name === "Status")

    console.log(`[createProjectBoard] Found Status field:`, statusField)

    let fieldId: string
    let fieldOptions2: Array<{ id: string; name: string }>

    if (statusField) {
      // Update the existing Status field options
      console.log(`[createProjectBoard] Updating existing Status field options...`)

      // First, delete existing options
      for (const option of statusField.options || []) {
        const deleteOptionMutation = `
          mutation($projectId: ID!, $fieldId: ID!, $optionId: ID!) {
            deleteProjectV2FieldOption(input: {
              projectId: $projectId
              fieldId: $fieldId
              optionId: $optionId
            }) {
              projectV2Field {
                ... on ProjectV2SingleSelectField {
                  id
                }
              }
            }
          }
        `
        try {
          await this.octokit.graphql(deleteOptionMutation, {
            projectId,
            fieldId: statusField.id,
            optionId: option.id,
          })
        } catch (error) {
          console.log(`[createProjectBoard] Could not delete option ${option.name}:`, error)
        }
      }

      // Add our custom options
      const newOptions: Array<{ id: string; name: string }> = []
      for (const column of boardConfig.columns) {
        const createOptionMutation = `
          mutation($projectId: ID!, $fieldId: ID!, $name: String!, $color: ProjectV2SingleSelectFieldOptionColor!) {
            createProjectV2FieldOption(input: {
              projectId: $projectId
              fieldId: $fieldId
              name: $name
              color: $color
            }) {
              projectV2FieldOption {
                id
                name
              }
            }
          }
        `
        const optionResult = await this.octokit.graphql<CreateFieldOptionResult>(createOptionMutation, {
          projectId,
          fieldId: statusField.id,
          name: column.name,
          color: "GRAY",
        })
        newOptions.push(optionResult.createProjectV2FieldOption.projectV2FieldOption)
      }

      fieldId = statusField.id
      fieldOptions2 = newOptions
      console.log(`[createProjectBoard] Updated Status field with ${newOptions.length} options`)
    } else {
      // Fallback: Create a custom Workflow field if Status doesn't exist
      const createFieldMutation = `
        mutation($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
          createProjectV2Field(input: {
            projectId: $projectId
            dataType: SINGLE_SELECT
            name: $name
            singleSelectOptions: $options
          }) {
            projectV2Field {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      `

      const fieldOptions = boardConfig.columns.map((column) => ({
        name: column.name,
        color: "GRAY",
        description: column.description || "",
      }))

      const fieldResult = await this.octokit.graphql<CreateFieldResult>(createFieldMutation, {
        projectId,
        name: "Workflow",
        options: fieldOptions,
      })

      fieldId = fieldResult.createProjectV2Field.projectV2Field.id
      fieldOptions2 = fieldResult.createProjectV2Field.projectV2Field.options
      console.log(`[createProjectBoard] Created Workflow field with ${fieldOptions2.length} options`)
    }

    // Get the ID of the first column (where all new issues should start)
    const firstColumnId = fieldOptions2[0]?.id
    if (!firstColumnId) {
      throw new Error("No columns defined in board configuration")
    }
    console.log(`[createProjectBoard] All issues will be placed in first column: ${fieldOptions2[0].name}`)

    // Step 4: Add all created issues to the project and set them to the first column
    console.log(`[createProjectBoard] Adding ${createdIssues.length} issues to project...`)

    if (createdIssues.length === 0) {
      console.warn(`[createProjectBoard] No new issues were created - they may already exist in the repository. The board was created but has no issues.`)
    }

    for (const issue of createdIssues) {
      try {
        console.log(`[createProjectBoard] Processing issue #${issue.number}...`)

        // Get issue node ID
        const issueQuery = `
          query($owner: String!, $repo: String!, $issueNumber: Int!) {
            repository(owner: $owner, name: $repo) {
              issue(number: $issueNumber) {
                id
              }
            }
          }
        `

        const issueResult = await this.octokit.graphql<IssueQueryResult>(issueQuery, {
          owner,
          repo,
          issueNumber: issue.number,
        })

        const issueId = issueResult.repository.issue.id
        console.log(`[createProjectBoard] Got issue ID: ${issueId}`)

        // Add issue to project
        const addItemMutation = `
          mutation($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
              item {
                id
              }
            }
          }
        `

        const itemResult = await this.octokit.graphql<AddItemResult>(addItemMutation, {
          projectId,
          contentId: issueId,
        })

        const itemId = itemResult.addProjectV2ItemById.item.id
        console.log(`[createProjectBoard] Added issue #${issue.number} to project with item ID: ${itemId}`)

        // Set all issues to the first column (e.g., "Todo" or "Backlog")
        const updateFieldMutation = `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
              value: $value
            }) {
              projectV2Item {
                id
              }
            }
          }
        `

        await this.octokit.graphql(updateFieldMutation, {
          projectId,
          itemId,
          fieldId,
          value: {
            singleSelectOptionId: firstColumnId,
          },
        })

        console.log(`[createProjectBoard] ✓ Issue #${issue.number} set to column "${fieldOptions2[0].name}"`)

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[createProjectBoard] Failed to add issue #${issue.number} to project:`, error)
        // Continue with other issues even if one fails
      }
    }

    return projectUrl
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
