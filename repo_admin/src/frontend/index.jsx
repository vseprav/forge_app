import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box, Button, Stack, Text, SectionMessage, Inline, Spinner
} from '@forge/react';
import { invoke } from '@forge/bridge';
import RepoList from "./components/RepoList";
import GitHubAuthForm from "./components/GitHubAuthForm";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [login, setLogin] = useState(null);

  const [status, setStatus] = useState({ type: 'info', msg: 'Paste your GitHub token and click Save.' });

  const [repos, setRepos] = useState([]);
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
  };

  const clear = async () => {
    try {
      await invoke('clearToken');
      setHasToken(false);
      setLogin(null);
      setRepos([]);
      setStatus({ type: 'info', msg: 'Token cleared. You can save a new one.' });
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Failed to clear token' });
    }
  };

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const list = await invoke('listRepos', {});
      setRepos(list);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Failed to load repos' });
    } finally {
      setLoadingRepos(false);
    }
  };

  if (loading) {
    return (
      <Box padding="space.200"><Inline><Spinner size="medium"/><Text>Loading…</Text></Inline></Box>
    );
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
            </Inline>

            <Inline space="space.100" alignBlock="center">
              <Button appearance="primary" onClick={loadRepos} isDisabled={loadingRepos}>
                {loadingRepos ? 'Loading…' : 'Load Repos'}
              </Button>
            </Inline>

            {loadingRepos && <Spinner />}
            <RepoList repos={repos} />
          </Stack>
        ) : (
          <GitHubAuthForm onSaved={onSaved} onStatus={setStatus} />
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App />);
