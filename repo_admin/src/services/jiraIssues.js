import * as forgeApi from "@forge/api";

export async function fetchJiraIssue(issueKey) {
  const res = await forgeApi.asApp().requestJira(`/rest/api/3/issue/${issueKey}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API failed: ${res.status} ${text}`);
  }
  return {
    key: res.key,
    summary: res.fields.summary,
    status: res.fields.status.name,
    assignee: res.fields.assignee?.displayName || null,
  };
}