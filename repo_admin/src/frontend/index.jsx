import React, {useEffect, useState} from 'react';
import ForgeReconciler, {Box, Button, Stack, Text, SectionMessage, Inline, Spinner} from '@forge/react';
import {invoke} from '@forge/bridge';
import GitHubAuthForm from './components/GitHubAuthForm';
import RepoList from "./components/RepoList";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [login, setLogin] = useState(null);
  const [status, setStatus] = useState({type: 'info', msg: 'Paste your GitHub token and click Save.'});


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
      setStatus({type: 'info', msg: 'Token cleared. You can save a new one.'});
    } catch (e) {
      setStatus({type: 'error', msg: e.message || 'Failed to clear token'});
    }
  };


  if (loading) {
    return <Box padding="space.200"><Inline><Spinner size="medium"/><Text>Loading…</Text></Inline></Box>;
  }

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        {hasToken ? (
          <Stack space="space.200">
            <Inline space="space.100" alignBlock="center">
              <Text>✅ Token is saved{login ? ` for ${login}` : ''}.</Text>
              <Button appearance="danger" onClick={clear}>Clear token</Button>
            </Inline>

            <RepoList/>
          </Stack>
        ) : (
          <Box>
            <Text>GitHub PR Bridge</Text>

            <SectionMessage appearance={
              status.type === 'success' ? 'confirmation' :
                status.type === 'error' ? 'error' : 'information'
            }>
              <Text>{status.msg}</Text>
            </SectionMessage>
            <GitHubAuthForm onSaved={onSaved} onStatus={setStatus}/>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App/>);
