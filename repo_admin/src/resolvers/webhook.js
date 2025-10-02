import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('prWebhookHandler', async ({ event }) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const pr = body.pull_request;
    console.log('body', body);

    console.log("GitHub webhook event:", action);

    if (action === "closed" && pr?.merged) {
      const title = pr.title || "";
      const branch = pr.head?.ref || "";

      console.log("Transitioning issue for PR", title, branch);
      // here later call transitionIssue(issueKey, "Done")
    }

    return { ok: true };
  } catch (err) {
    console.error("Webhook handler error:", err);
    throw err;
  }
});

export const prWebhookHandler = resolver.getDefinitions();
