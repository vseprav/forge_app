export async function prWebhookHandler(event, context) {
  try {
    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const pr = body.pull_request;

    console.log("GitHub webhook event:", action, "pr:", pr);

    if (action === "closed" && pr?.merged) {
      const title = pr.title || "";
      const branch = pr.head?.ref || "";

      console.log("Transitioning issue for PR:", title, branch);

      // later: call transitionIssue(issueKey, "Done")
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Webhook handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
