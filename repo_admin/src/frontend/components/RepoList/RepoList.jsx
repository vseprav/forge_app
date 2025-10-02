import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Heading,
  Inline,
  Link,
  SectionMessage,
  Spinner,
  Stack,
  Text,
} from '@forge/react';
import {invoke} from '@forge/bridge';
import PullList from "../PullList";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || 'n/a';
  }
}

function permLabel(p) {
  if (p?.admin) return 'admin';
  if (p?.push) return 'write';
  return 'read';
}

export default function RepoList() {
  const [repoPage, setRepoPage] = useState({
    repos: [],
    page: 1,
    perPage: 5,
    hasPrev: false,
    hasNext: false,
  });
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadPage(1);
  }, []);

  const loadPage = async (page) => {
    setLoadingRepos(true);
    try {
      const res = await invoke('listRepos', {page, perPage: repoPage.perPage});
      setRepoPage(res);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to load repos');
    } finally {
      setLoadingRepos(false);
    }
  };

  const onPrev = () => loadPage(Math.max(1, (repoPage.page || 1) - 1));
  const onNext = () => loadPage((repoPage.page || 1) + 1);

  const repos = repoPage?.repos || [];
  const page = repoPage?.page || 1;
  const hasPrev = !!repoPage?.hasPrev;
  const hasNext = !!repoPage?.hasNext;

  return (
    <Box>
      {loadingRepos && <Spinner/>}
      {errorMessage && (
        <SectionMessage appearance="error">
          <Text>{errorMessage}</Text>
        </SectionMessage>
      )}

      <Stack space="space.200">
        <Heading level="h300">Repositories</Heading>

        <Box padding="space.100" backgroundColor="elevation.surface.raised">
          <Inline space="space.400" grow="fill">
            <Box grow="3"><Text weight="bold">Name</Text></Box>
            <Box grow="1"><Text weight="bold">Actions</Text></Box>
          </Inline>
        </Box>

        {repos.length === 0 ? (
          <Text>{loadingRepos ? 'Loading…' : 'No repositories found.'}</Text>
        ) : (
          repos.map((r, idx) => (
            <Box
              key={r.id}
              padding="space.100"
              backgroundColor={idx % 2 === 0 ? 'elevation.surface' : 'elevation.surface.hovered'}
            >
              <Inline space="space.400" grow="fill" alignBlock="center">
                <Box grow="3">
                  <Button
                    appearance="subtle"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {expandedId === r.id ? '▼' : '▶'} {r.full_name}
                  </Button>
                </Box>
                <Box grow="1"><Link href={r.html_url} openNewTab>Open</Link></Box>
              </Inline>

              {expandedId === r.id && (
                <Box padding="space.150" backgroundColor="elevation.surface.sunken">
                  <Stack space="space.100">
                    <Text>Language: {r.language || '—'}</Text>
                    <Text>Stars: {r.stargazers_count ?? 0}</Text>
                    <Text>Forks: {r.forks_count ?? 0}</Text>
                    <Text>Issues: {r.open_issues_count ?? 0}</Text>
                    <Text>Permissions: {permLabel(r.permissions)}</Text>
                    <Text>Description: {r.description || '—'}</Text>
                    <Text>Clone URL: {r.clone_url}</Text>
                    <Text>Created: {fmtDate(r.created_at)}</Text>
                    <Text>Updated: {fmtDate(r.updated_at)}</Text>

                    <Heading level="h400">Pull Requests</Heading>
                    <PullList owner={r.owner} repo={r.name}/>
                  </Stack>
                </Box>
              )}
            </Box>
          ))
        )}

        <Inline space="space.150" alignBlock="center">
          <Button onClick={onPrev} isDisabled={!hasPrev || loadingRepos}>Prev</Button>
          <Text>Page {page}</Text>
          <Button onClick={onNext} isDisabled={!hasNext || loadingRepos}>Next</Button>
        </Inline>
      </Stack>
    </Box>
  );
}
