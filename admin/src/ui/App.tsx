import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Feature = { key: string; label?: string; type?: 'string' | 'number' | 'boolean'; description?: string };

type AppConfig = {
  brand_name?: string;
  theme_primary?: string;
  theme_accent?: string;
  scan_type?: string;
  main_prompt?: string;
  features?: Feature[];
  env?: { openai_api_key?: string; model?: string; temperature?: number };
};

const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:4000';

export const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({ features: [] });
  const [adminToken, setAdminToken] = useState('');
  const [status, setStatus] = useState<string>('');

  const themeStyles = useMemo(() => ({
    '--primary': config.theme_primary || '#6C5CE7',
    '--accent': config.theme_accent || '#00CEC9',
  } as React.CSSProperties), [config.theme_primary, config.theme_accent]);

  const client = axios.create({ baseURL: BACKEND_URL });

  const load = async () => {
    setStatus('Loading...');
    try {
      const res = await client.get('/api/admin/config');
      setConfig(res.data.config || {});
      setStatus('Loaded');
    } catch (e: any) {
      setStatus('Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  const updateField = (field: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateEnv = (field: keyof NonNullable<AppConfig['env']>, value: any) => {
    setConfig(prev => ({ ...prev, env: { ...(prev.env || {}), [field]: value } }));
  };

  const updateFeature = (index: number, key: keyof Feature, value: any) => {
    const feats = [...(config.features || [])];
    feats[index] = { ...feats[index], [key]: value } as Feature;
    setConfig(prev => ({ ...prev, features: feats.slice(0, 4) }));
  };

  const addFeature = () => {
    const feats = [...(config.features || [])];
    if (feats.length >= 4) return;
    feats.push({ key: '' });
    setConfig(prev => ({ ...prev, features: feats }));
  };

  const removeFeature = (index: number) => {
    const feats = [...(config.features || [])];
    feats.splice(index, 1);
    setConfig(prev => ({ ...prev, features: feats }));
  };

  const save = async () => {
    setStatus('Saving...');
    try {
      await client.post('/api/admin/config', config, {
        headers: { 'x-admin-token': adminToken }
      });
      setStatus('Saved');
      await load();
    } catch (e: any) {
      setStatus(e?.response?.data?.error || 'Save failed');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, background: '#0b1020', color: 'white', minHeight: '100vh', ...themeStyles }}>
      <h1 style={{ color: 'var(--primary)' }}>{config.brand_name || 'AI Asset Admin'}</h1>
      <p style={{ opacity: 0.8 }}>Status: {status}</p>

      <section style={{ marginTop: 16, padding: 16, background: '#121a35', borderRadius: 12 }}>
        <h2>Admin Auth</h2>
        <input placeholder="Admin Token" value={adminToken} onChange={e => setAdminToken(e.target.value)} style={{ width: 320 }} />
      </section>

      <section style={{ marginTop: 16, padding: 16, background: '#121a35', borderRadius: 12 }}>
        <h2>Branding</h2>
        <div>
          <label>Brand Name</label><br/>
          <input value={config.brand_name || ''} onChange={e => updateField('brand_name', e.target.value)} style={{ width: 320 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Theme Primary</label><br/>
          <input type="color" value={config.theme_primary || '#6C5CE7'} onChange={e => updateField('theme_primary', e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Theme Accent</label><br/>
          <input type="color" value={config.theme_accent || '#00CEC9'} onChange={e => updateField('theme_accent', e.target.value)} />
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 16, background: '#121a35', borderRadius: 12 }}>
        <h2>Scan Defaults</h2>
        <div>
          <label>Default Scan Type</label><br/>
          <input value={config.scan_type || 'coin'} onChange={e => updateField('scan_type', e.target.value)} style={{ width: 200 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Main Prompt</label><br/>
          <textarea value={config.main_prompt || ''} onChange={e => updateField('main_prompt', e.target.value)} rows={6} style={{ width: 600 }} />
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 16, background: '#121a35', borderRadius: 12 }}>
        <h2>Features (up to 4)</h2>
        {(config.features || []).map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input placeholder="key" value={f.key} onChange={e => updateFeature(i, 'key', e.target.value)} />
            <input placeholder="label" value={f.label || ''} onChange={e => updateFeature(i, 'label', e.target.value)} />
            <select value={f.type || 'string'} onChange={e => updateFeature(i, 'type', e.target.value)}>
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            <input placeholder="description" value={f.description || ''} onChange={e => updateFeature(i, 'description', e.target.value)} style={{ width: 320 }} />
            <button onClick={() => removeFeature(i)}>Remove</button>
          </div>
        ))}
        <button onClick={addFeature} disabled={(config.features || []).length >= 4}>Add feature</button>
      </section>

      <section style={{ marginTop: 16, padding: 16, background: '#121a35', borderRadius: 12 }}>
        <h2>Env Overrides</h2>
        <div>
          <label>OpenAI API Key</label><br/>
          <input value={config.env?.openai_api_key || ''} onChange={e => updateEnv('openai_api_key', e.target.value)} style={{ width: 400 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Model</label><br/>
          <input value={config.env?.model || ''} onChange={e => updateEnv('model', e.target.value)} style={{ width: 200 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Temperature</label><br/>
          <input type="number" step="0.1" value={config.env?.temperature ?? 0.1} onChange={e => updateEnv('temperature', Number(e.target.value))} style={{ width: 120 }} />
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <button onClick={save} style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', border: 0, borderRadius: 8 }}>Save Config</button>
      </div>
    </div>
  );
};


