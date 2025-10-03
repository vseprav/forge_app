import {extractJiraKey, transitionIssueToDone} from "../services/jiraIssues";

export async function prWebhookHandler(event, context) {
  try {
    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const pr = body.pull_request;

    console.log("GitHub webhook event:", action);

    if (action === "closed" && pr?.merged) {
      const title = pr.title || "";
      const branch = pr.head?.ref || "";

      console.log("Transitioning issue for PR:", title, branch);
      const jiraKey = extractJiraKey(title) || extractJiraKey(branch);
      if (jiraKey) {
        console.log(`Transitioning Jira issue ${jiraKey} to Done`);
        await transitionIssueToDone(jiraKey);
      } else {
        console.log("No Jira key found in PR title/branch");
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ok: true}),
    };
  } catch (err) {
    console.error("Webhook handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({error: err.message}),
    };
  }
}
