import { db, getSetting } from '../db/schema.js';

export async function exportData() {
  const [supplies, bills, dining, settings] = await Promise.all([
    db.supplies.toArray(),
    db.bills.toArray(),
    db.dining.toArray(),
    db.settings.toArray(),
  ]);

  const sanitizedSupplies = supplies.map(({ imageBlob, imageUrl, ...rest }) => ({
    ...rest,
    hasImage: Boolean(imageBlob || imageUrl),
  }));

  return {
    app: 'HomeRow',
    version: 2,
    exportedAt: new Date().toISOString(),
    supplies: sanitizedSupplies,
    bills,
    dining,
    settings,
  };
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(payload) {
  if (!payload || payload.app !== 'HomeRow') {
    throw new Error('Invalid HomeRow backup file');
  }
  await db.transaction('rw', db.supplies, db.bills, db.dining, db.settings, async () => {
    await db.supplies.clear();
    await db.bills.clear();
    await db.dining.clear();
    await db.settings.clear();
    if (payload.supplies?.length) await db.supplies.bulkAdd(payload.supplies);
    if (payload.bills?.length) await db.bills.bulkAdd(payload.bills);
    if (payload.dining?.length) await db.dining.bulkAdd(payload.dining);
    if (payload.settings?.length) await db.settings.bulkPut(payload.settings);
  });
}

export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-homerow-gis]');
    if (existing) {
      existing.addEventListener('load', resolve);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.dataset.homerowGis = '1';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function getGoogleClientId() {
  return (await getSetting('googleClientId')) || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

export async function uploadToGoogleDrive(jsonData, filename) {
  const clientId = await getGoogleClientId();
  if (!clientId) {
    throw new Error(
      'Google Client ID not configured. Add it in Backup settings (from Google Cloud Console → OAuth 2.0 Client ID for Web).',
    );
  }

  await loadGoogleScript();

  const token = await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) reject(new Error(resp.error));
        else resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });

  const metadata = {
    name: filename,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  form.append('file', new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  return res.json();
}
