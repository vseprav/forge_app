import React, { useState } from 'react';
import { Stack, Textfield, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

export default function GitHubAuthForm({ onSaved, onStatus }) {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    onStatus({ type: 'info', msg: 'Validating token…' });
    try {
      const res = await invoke('validateAndSaveToken', { token });
      onStatus({ type: 'success', msg: `Token saved for GitHub user ${res.login}.` });
      setToken('');
      onSaved(res.login);
    } catch (e) {
      onStatus({ type: 'error', msg: e.message || 'Failed to save token' });
    } finally {
      setSaving(false);
    }
  };

  return (
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
  );
}
