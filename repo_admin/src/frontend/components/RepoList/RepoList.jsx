import React, {useEffect, useState} from 'react';
import {Box, Button, Heading, Inline, Link, SectionMessage, Spinner, Stack, Text} from '@forge/react';
import {invoke} from "@forge/bridge";

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
  const [repoPage, setRepoPage] = useState({repos: [], page: 1, perPage: 5, hasPrev: false, hasNext: false});
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (() => {
      loadPage(1)
    })();
  }, []);

  const loadPage = async (page) => {
    setLoadingRepos(true);
    try {
      const res = await invoke('listRepos', {page, perPage: repoPage.perPage});
      setRepoPage(res);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to load repos')
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

  console.log(repos[0]);

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

        <Box padding="space.150" backgroundColor="elevation.surface.raised">
          <Inline space="space.300" alignBlock="center" grow="fill">
            <Box grow="1"><Text>Name</Text></Box>
            <Box><Text>Visibility</Text></Box>
            <Box><Text>Branch</Text></Box>
            <Box><Text>Last push</Text></Box>
            <Box><Text>Lang</Text></Box>
            <Box><Text>Starts count</Text></Box>
            <Box><Text>Forks count</Text></Box>
            <Box><Text>Issues</Text></Box>
            <Box><Text>Perm</Text></Box>
            <Box><Text>Actions</Text></Box>
          </Inline>
        </Box>

        {repos.length === 0 ? (
          <Text>{loadingRepos ? 'Loading…' : 'No repositories found.'}</Text>
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
                <Box><Link href={r.html_url} openNewTab>Open</Link></Box>
              </Inline>
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
