import React, { useEffect, useState } from 'react';
import { Box, Inline, Link, Spinner, Stack, Text } from '@forge/react';
import { invoke } from '@forge/bridge';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || 'n/a';
  }
}

export default function PullList({ owner, repo }) {
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const prs = await invoke('listPulls', { owner, repo });
        if (!prs || prs.length === 0) {
          setPulls([]);
          return;
        }

        const keys = prs.map(p => p.jiraKey).filter(Boolean);
        let issueMap = {};
        if (keys.length) {
          const issues = await invoke('getIssues', { keys });
          issues.forEach(i => {
            issueMap[i.key] = i;
          });
        }

        // merge issues into PRs
        const enriched = prs.map(p => ({
          ...p,
          issue: p.jiraKey ? issueMap[p.jiraKey] : null,
        }));
        setPulls(enriched);
      } catch (e) {
        setErrorMessage(e.message || 'Failed to load pull requests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [owner, repo]);

  if (loading) {
    return (
      <Box padding="space.100">
        <Spinner /> <Text>Loading PRs…</Text>
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box padding="space.100">
        <Text tone="critical">{errorMessage}</Text>
      </Box>
    );
  }

  if (pulls.length === 0) {
    return (
      <Box padding="space.100">
        <Text>No open pull requests linked to Jira issues.</Text>
      </Box>
    );
  }

  return (
    <Stack space="space.100">
      {pulls.map((pr) => (
        <Box key={pr.id} padding="space.100" backgroundColor="elevation.surface.raised">
          <Stack space="space.100">
            <Inline space="space.150" alignBlock="center">
              <Text weight="bold">#{pr.number}</Text>
              <Link href={pr.html_url} openNewTab>{pr.title}</Link>
            </Inline>
            <Text>Author: {pr.user}</Text>
            <Text>Branch: {pr.branch}</Text>
            <Text>Created: {fmtDate(pr.created_at)}</Text>

            {/* Jira issue details if found */}
            {pr.issue ? (
              <Box padding="space.050">
                <Text>📝 {pr.issue.key}: {pr.issue.summary}</Text>
                <Text>Status: {pr.issue.status}</Text>
                {pr.issue.assignee && <Text>Assignee: {pr.issue.assignee}</Text>}
              </Box>
            ) : (
              <Text tone="subtle">No Jira issue found</Text>
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
