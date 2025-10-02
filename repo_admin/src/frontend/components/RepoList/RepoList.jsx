import React from 'react';
import { Stack, Box, Text } from '@forge/react';

export default function RepoList({ repos = [] }) {
  if (!repos.length) return <Text>No repositories loaded yet.</Text>;

  return (
    <Stack space="space.100">
      {repos.map((r) => (
        <Box key={r.id} padding="space.100" backgroundColor="elevation.surface">
          <Stack space="space.050">
            <Text>{r.full_name}</Text>
            <Text>Language: {r.language || 'n/a'}</Text>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
