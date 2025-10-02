import { requestJira, route } from '@forge/api';

export async function fetchJiraIssue(keys) {
  if (!keys || !keys.length) return [];

  const results = [];
  for (const key of keys) {
    try {
      const issueRes = await requestJira(route`/rest/api/3/issue/${key}`);
      console.log(`/rest/api/3/issue/${key}`);
      if (!issueRes.ok) {
        const text = await issueRes.text();
        console.error(`Failed to fetch issue ${key}: ${issueRes.status} ${text}`);
        continue;
      }
      const issue = await issueRes.json();
      console.log(issue);
      results.push({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || null,
      });
    } catch (err) {
      console.error(`Error fetching issue ${key}`, err);
    }
  }

  return results;
}
