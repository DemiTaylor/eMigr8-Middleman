/**
 * Safe fetch helper for client-side API requests.
 * Prevents "Unexpected token '<', '<html><hea'... is not valid JSON" errors
 * by checking content types, detecting HTML responses, and extracting HTML titles.
 */

export interface SafeFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtml?: boolean;
  htmlTitle?: string;
  rawText?: string;
}

export async function safeFetchJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(init?.headers || {})
      }
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const trimmed = rawText.trim();

    // Detect if server returned HTML (Vite fallback, 404/500 HTML error page, web portal, etc.)
    const isHtml = 
      contentType.includes('text/html') || 
      trimmed.startsWith('<!doctype') || 
      trimmed.startsWith('<!DOCTYPE') || 
      trimmed.startsWith('<html') || 
      trimmed.startsWith('<head');

    if (isHtml) {
      let htmlTitle = '';
      const match = rawText.match(/<title>([^<]*)<\/title>/i);
      if (match && match[1]) {
        htmlTitle = match[1].trim();
      }

      const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
      const titleSnippet = htmlTitle ? `("${htmlTitle}")` : 'web page';

      return {
        ok: false,
        status: res.status,
        data: null,
        isHtml: true,
        htmlTitle: htmlTitle || undefined,
        rawText,
        error: `Expected JSON response but received an HTML document ${titleSnippet} from ${urlStr}. This typically occurs when a URL points to a website frontend instead of a JSON API endpoint, or an unknown API route was requested.`
      };
    }

    // Attempt to parse JSON safely
    try {
      const data = trimmed ? (JSON.parse(trimmed) as T) : ({} as T);
      
      if (!res.ok) {
        const errMsg = 
          (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') 
            ? (data as { error: string }).error
            : (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string')
              ? (data as { message: string }).message
              : `HTTP ${res.status}: Request failed`;
        return {
          ok: false,
          status: res.status,
          data,
          error: errMsg,
          rawText
        };
      }

      return {
        ok: true,
        status: res.status,
        data,
        rawText
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        rawText,
        error: `Server responded with non-JSON text (HTTP ${res.status}): ${trimmed.slice(0, 120)}`
      };
    }
  } catch (netErr: unknown) {
    const message = netErr instanceof Error ? netErr.message : 'Network request failed';
    return {
      ok: false,
      status: 0,
      data: null,
      error: message
    };
  }
}
