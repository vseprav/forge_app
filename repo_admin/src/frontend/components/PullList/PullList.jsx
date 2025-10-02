import React, {useEffect, useState} from 'react';
import {Box, Inline, Link, Spinner, Stack, Text} from '@forge/react';
import {invoke} from '@forge/bridge';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || 'n/a';
  }
}

export default function PullList({owner, repo}) {
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await invoke('listPulls', {owner, repo});
        setPulls(res || []);
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
        <Spinner/> <Text>Loading PRs…</Text>
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
        <Text>No open pull requests.</Text>
      </Box>
    );
  }

  return (
    <Stack space="space.100">
      {pulls.map((pr) => (
        <Box key={pr.id} padding="space.100" backgroundColor="elevation.surface.raised">
          <Stack space="space.050">
            <Inline space="space.150" alignBlock="center">
              <Text weight="bold">#{pr.number}</Text>
              <Link href={pr.html_url} openNewTab>{pr.title}</Link>
            </Inline>
            <Text>Author: {pr.user}</Text>
            <Text>Branch: {pr.branch}</Text>
            <Text>Created: {fmtDate(pr.created_at)}</Text>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
