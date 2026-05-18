import { useState, useEffect } from 'preact/hooks';
import { exportData, downloadJson, importData, uploadToGoogleDrive, getGoogleClientId } from '../../lib/backup.js';
import { setSetting } from '../../db/schema.js';

export function BackupView() {
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getGoogleClientId().then(setClientId);
  }, []);

  const handleExport = async () => {
    setBusy(true);
    setStatus('');
    try {
      const data = await exportData();
      const name = `homerow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(data, name);
      setStatus(`Downloaded ${name} (images excluded).`);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      await importData(JSON.parse(text));
      setStatus('Backup restored successfully.');
    } catch (err) {
      setStatus(`Import failed: ${err.message}`);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const saveClientId = async () => {
    await setSetting('googleClientId', clientId.trim());
    setStatus('Google Client ID saved.');
  };

  const handleDriveUpload = async () => {
    setBusy(true);
    setStatus('');
    try {
      if (clientId.trim()) await setSetting('googleClientId', clientId.trim());
      const data = await exportData();
      const name = `homerow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const file = await uploadToGoogleDrive(data, name);
      setStatus(`Uploaded to Google Drive (file id: ${file.id}).`);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0;">
        All data stays in your browser (IndexedDB). Backups exclude photos to keep files small.
      </p>

      <div class="card" style="margin: 1rem 0;">
        <h2 style="margin: 0 0 0.75rem; font-size: 1rem;">Local backup</h2>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <button type="button" class="btn btn-primary" onClick={handleExport} disabled={busy}>
            Download JSON backup
          </button>
          <label class="btn btn-ghost" style="text-align: center; cursor: pointer;">
            Restore from file
            <input type="file" accept="application/json,.json" onChange={handleImport} style="display: none;" disabled={busy} />
          </label>
        </div>
      </div>

      <div class="card" style="margin: 1rem 0;">
        <h2 style="margin: 0 0 0.75rem; font-size: 1rem;">Google Drive</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 0.75rem;">
          Create an OAuth 2.0 Web Client ID in{' '}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style="color: var(--accent);">
            Google Cloud Console
          </a>
          . Enable the Drive API. Add your site origin to authorized JavaScript origins.
        </p>
        <div class="field">
          <label>OAuth Client ID</label>
          <input
            type="text"
            placeholder="xxxx.apps.googleusercontent.com"
            value={clientId}
            onInput={(e) => setClientId(e.target.value)}
          />
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-ghost" onClick={saveClientId}>
            Save ID
          </button>
          <button type="button" class="btn btn-primary" onClick={handleDriveUpload} disabled={busy}>
            Upload backup to Drive
          </button>
        </div>
      </div>

      {status && (
        <p style="font-size: 0.85rem; color: var(--accent); margin-top: 1rem; word-break: break-word;">{status}</p>
      )}

      <h2 class="section-title">Storage</h2>
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        HomeRow uses IndexedDB — typically hundreds of MB available per origin, far more than localStorage.
        Images are stored locally only and are not included in cloud backups.
      </p>
    </>
  );
}
