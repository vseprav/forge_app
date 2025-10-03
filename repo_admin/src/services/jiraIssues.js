import { requestJira, route } from '@forge/api';

export function extractJiraKey(text) {
  if (!text) return null;
  const match = text.match(/\b[A-Z][A-Z0-9]+-\d+\b/);
  return match ? match[0] : null;
}

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

export async function transitionIssueToDone(issueKey) {
  try {
    const transRes = await requestJira(
      route`/rest/api/3/issue/${issueKey}/transitions`
    );
    const transData = await transRes.json();
    console.log("Available transitions:", transData);

    if (!transRes.ok) {
      throw new Error(`Failed to get transitions: ${transRes.status} ${JSON.stringify(transData)}`);
    }

    const doneTransition = (transData.transitions || []).find(
      (t) => t.name.toLowerCase() === "done"
    );

    if (!doneTransition) {
      throw new Error(`No 'Done' transition available for issue ${issueKey}`);
    }

    const body = {
      transition: { id: doneTransition.id },
    };

    const res = await requestJira(
      route`/rest/api/3/issue/${issueKey}/transitions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to transition issue ${issueKey}: ${res.status} ${text}`);
    }

    console.log(`Issue ${issueKey} transitioned to Done`);
    return { ok: true, issueKey };
  } catch (err) {
    console.error("transitionIssueToDone error:", err);
    return { ok: false, error: err.message };
  }
}