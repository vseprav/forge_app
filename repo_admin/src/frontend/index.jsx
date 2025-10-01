import React, {useEffect, useState} from 'react';
import ForgeReconciler, {
  Box, Button, Stack, Text, Textfield, SectionMessage, Inline, Spinner
} from '@forge/react';
import {invoke} from '@forge/bridge';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [login, setLogin] = useState(null);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
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

  const save = async () => {
    setSaving(true);
    setStatus({type: 'info', msg: 'Validating token…'});
    try {
      const res = await invoke('validateAndSaveToken', {token});
      setStatus({type: 'success', msg: `Token saved for GitHub user ${res.login}.`});
      setToken('');
      setHasToken(true);
      setLogin(res.login);
    } catch (e) {
      setStatus({type: 'error', msg: e.message || 'Failed to save token'});
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await invoke('clearToken');
      setHasToken(false);
      setLogin(null);
      setStatus({type: 'info', msg: 'Token cleared. You can save a new one.'});
    } catch (e) {
      setStatus({type: 'error', msg: e.message || 'Failed to clear token'});
    } finally {
      setSaving(false);
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
        <Text>GitHub PR Bridge — Auth</Text>

        <SectionMessage appearance={
          status.type === 'success' ? 'confirmation' :
            status.type === 'error' ? 'error' :
              'information'
        }>
          <Text>{status.msg}</Text>
        </SectionMessage>

        {hasToken ? (
          <Stack space="space.150">
            <Text>✅ Token is saved{login ? ` for ${login}` : ''}.</Text>
            <Inline space="space.100">
              <Button appearance="danger" onClick={clear} isDisabled={saving}>
                {saving ? 'Clearing…' : 'Clear token'}
              </Button>
            </Inline>
          </Stack>
        ) : (
          <Stack space="space.150">
            <Textfield
              name="token"
              label="GitHub Personal Access Token (scope: repo)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button appearance="primary" onClick={save} isDisabled={!token || saving}>
              {saving ? 'Saving…' : 'Save & Validate'}
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App/>);
