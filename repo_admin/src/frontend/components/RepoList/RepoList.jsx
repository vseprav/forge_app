import React from 'react';
import { Box, Button, Heading, Inline, Stack, Text } from '@forge/react';

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso || 'n/a'; }
}
function permLabel(p) {
  if (p?.admin) return 'admin';
  if (p?.push) return 'write';
  return 'read';
}

export default function RepoList({ data, loading, onPrev, onNext }) {
  const repos = data?.repos || [];
  const page = data?.page || 1;
  const hasPrev = !!data?.hasPrev;
  const hasNext = !!data?.hasNext;

  return (
    <Stack space="space.200">
      <Heading level="h300">Repositories</Heading>

      <Box padding="space.150" backgroundColor="elevation.surface.raised">
        <Inline space="space.300" alignBlock="center" grow="fill">
          <Box grow="1"><Text>Name</Text></Box>
          <Box><Text>Visibility</Text></Box>
          <Box><Text>Branch</Text></Box>
          <Box><Text>Last push</Text></Box>
          <Box><Text>Lang</Text></Box>
          <Box><Text>⭐</Text></Box>
          <Box><Text>🍴</Text></Box>
          <Box><Text>Issues</Text></Box>
          <Box><Text>Perm</Text></Box>
          <Box><Text>Actions</Text></Box>
        </Inline>
      </Box>

      {repos.length === 0 ? (
        <Text>{loading ? 'Loading…' : 'No repositories found.'}</Text>
      ) : (
        repos.map((r, idx) => (
          <Box
            key={r.id}
            padding="space.150"
            backgroundColor={idx % 2 === 0 ? 'elevation.surface' : 'elevation.surface.hovered'}
          >
            <Inline space="space.300" alignBlock="center" grow="fill">
              <Box grow="1"><Text>{r.full_name}</Text></Box>
              <Box><Text>{r.visibility || 'n/a'}</Text></Box>
              <Box><Text>{r.default_branch || 'n/a'}</Text></Box>
              <Box><Text>{fmtDate(r.pushed_at)}</Text></Box>
              <Box><Text>{r.language || 'n/a'}</Text></Box>
              <Box><Text>{r.stargazers_count ?? 0}</Text></Box>
              <Box><Text>{r.forks_count ?? 0}</Text></Box>
              <Box><Text>{r.open_issues_count ?? 0}</Text></Box>
              <Box><Text>{permLabel(r.permissions)}</Text></Box>
              <Box><Button href={r.html_url} target="_blank">Open</Button></Box>
            </Inline>
          </Box>
        ))
      )}

      <Inline space="space.150" alignBlock="center">
        <Button onClick={onPrev} isDisabled={!hasPrev || loading}>Prev</Button>
        <Text>Page {page}</Text>
        <Button onClick={onNext} isDisabled={!hasNext || loading}>Next</Button>
      </Inline>
    </Stack>
  );
}
