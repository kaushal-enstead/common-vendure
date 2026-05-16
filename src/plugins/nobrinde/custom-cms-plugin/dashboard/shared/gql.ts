let RESOLVED_ENDPOINT: string | null = null;

function buildEndpointCandidates(): string[] {
  const tried: string[] = [];
  const w: any = window as any;
  if (w.PAYLOAD_CMS_ADMIN_API) tried.push(String(w.PAYLOAD_CMS_ADMIN_API));

  const cfg: any = w.VENDURE_CONFIG || w.vendureConfig || {};
  if (cfg.adminApiPath) {
    const host = cfg.apiHost ?? '';
    tried.push(`${host}${cfg.adminApiPath}`);
  }

  const baseHref = document.querySelector('base')?.getAttribute('href') || document.baseURI || '/';
  const m = baseHref.match(/^(https?:\/\/[^/]+)?(.*?\/dashboard\/)/);
  if (m) {
    const origin = m[1] || window.location.origin;
    const dashboardBase = m[2];
    tried.push(`${origin}${dashboardBase}admin-api`);
  }

  tried.push('/dashboard/admin-api');
  tried.push('/admin-api');
  tried.push(`${window.location.protocol}//${window.location.hostname}:3000/dashboard/admin-api`);
  tried.push(`${window.location.protocol}//${window.location.hostname}:3000/admin-api`);

  return Array.from(new Set(tried.map(u => u.replace(/([^:]\/)\/+/g, '$1'))));
}

async function tryFetch<T>(url: string, query: string, variables?: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Non-JSON (${res.status}) ${url} → ${text.slice(0, 120)}…`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    const msg = json.errors.map((e: any) => e.message).join(' | ');
    throw new Error(`GraphQL error @ ${url} → ${msg}`);
  }
  return json.data;
}

export async function resolveAdminApi(): Promise<string> {
  if (RESOLVED_ENDPOINT) return RESOLVED_ENDPOINT;
  const candidates = buildEndpointCandidates();
  const ping = `query { __typename }`;
  for (const url of candidates) {
    try {
      await tryFetch(url, ping);
      RESOLVED_ENDPOINT = url;
      return url;
    } catch {}
  }
  throw new Error(
    `Cannot resolve Admin API endpoint.\nDefine window.PAYLOAD_CMS_ADMIN_API = 'http://localhost:3000/dashboard/admin-api'`,
  );
}

export async function gqlFetch<T>(query: string, variables?: any): Promise<T> {
  const url = await resolveAdminApi();
  return tryFetch<T>(url, query, variables);
}
