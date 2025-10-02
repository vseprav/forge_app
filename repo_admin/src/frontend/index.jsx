import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Box, Button, Stack, Text, SectionMessage, Inline, Spinner } from '@forge/react';
import { invoke } from '@forge/bridge';
import GitHubAuthForm from './components/GitHubAuthForm';
import RepoList from "./components/RepoList";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [login, setLogin] = useState(null);
  const [status, setStatus] = useState({ type: 'info', msg: 'Paste your GitHub token and click Save.' });

  const [repoPage, setRepoPage] = useState({ items: [], page: 1, perPage: 5, hasPrev: false, hasNext: false });
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await invoke('getAuthStatus');
        setHasToken(!!s.hasToken);
        setLogin(s.login || null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaved = (ghLogin) => {
    setHasToken(true);
    setLogin(ghLogin);
    loadPage(1); // auto-load page 1 after saving
  };

  const clear = async () => {
    try {
      await invoke('clearToken');
      setHasToken(false);
      setLogin(null);
      setRepoPage({ items: [], page: 1, perPage: 10, hasPrev: false, hasNext: false });
      setStatus({ type: 'info', msg: 'Token cleared. You can save a new one.' });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Failed to clear token' });
    }
  };

  const loadPage = async (page) => {
    setLoadingRepos(true);
    try {
      const res = await invoke('listRepos', { page, perPage: repoPage.perPage });
      setRepoPage(res);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Failed to load repos' });
    } finally {
      setLoadingRepos(false);
    }
  };

  const onPrev = () => loadPage(Math.max(1, (repoPage.page || 1) - 1));
  const onNext = () => loadPage((repoPage.page || 1) + 1);

  if (loading) {
    return <Box padding="space.200"><Inline><Spinner size="medium"/><Text>Loading…</Text></Inline></Box>;
  }

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Text>GitHub PR Bridge</Text>

        <SectionMessage appearance={
          status.type === 'success' ? 'confirmation' :
            status.type === 'error' ? 'error' : 'information'
        }>
          <Text>{status.msg}</Text>
        </SectionMessage>

        {hasToken ? (
          <Stack space="space.200">
            <Inline space="space.100" alignBlock="center">
              <Text>✅ Token is saved{login ? ` for ${login}` : ''}.</Text>
              <Button appearance="danger" onClick={clear}>Clear token</Button>
              <Button appearance="primary" onClick={() => loadPage(1)} isDisabled={loadingRepos}>
                {loadingRepos ? 'Loading…' : 'Load repos'}
              </Button>
            </Inline>

            {loadingRepos && <Spinner />}
            <RepoList data={repoPage} loading={loadingRepos} onPrev={onPrev} onNext={onNext} />
          </Stack>
        ) : (
          <GitHubAuthForm onSaved={onSaved} onStatus={setStatus} />
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App />);
