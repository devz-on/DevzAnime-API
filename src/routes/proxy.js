function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function toAbsoluteUrl(input, baseUrl) {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return input;
  }
}

function rewriteManifest(manifest, sourceUrl) {
  const uriAttrRegex = /URI=(["'])([^"']+)\1/g;

  return manifest
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const lineWithRewrittenUri = line.replace(uriAttrRegex, (full, quote, uri) => {
        const absolute = toAbsoluteUrl(uri, sourceUrl);
        return `URI=${quote}${absolute}${quote}`;
      });

      if (trimmed.startsWith('#')) {
        return lineWithRewrittenUri;
      }

      return toAbsoluteUrl(trimmed, sourceUrl);
    })
    .join('\n');
}

function isManifestContentType(contentType) {
  const value = (contentType || '').toLowerCase();
  return (
    value.includes('application/vnd.apple.mpegurl') ||
    value.includes('application/x-mpegurl') ||
    value.includes('audio/mpegurl')
  );
}

function isVttUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.vtt');
  } catch {
    return false;
  }
}

const proxyCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  Vary: 'Origin',
};
const preferredAttemptByHost = new Map();

function applyProxyCorsHeaders(headers) {
  Object.entries(proxyCorsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

function attemptSignature(attempt) {
  return `${attempt.referer || 'none'}|${attempt.includeOrigin ? 'origin' : 'no-origin'}`;
}

export function proxyOptionsHandler() {
  return new Response(null, {
    status: 204,
    headers: proxyCorsHeaders,
  });
}

export async function proxyHandler(c) {
  const targetUrlRaw = c.req.query('url') || c.req.query('u');
  const referer = c.req.query('referer') || 'https://megacloud.tv';
  const hostOverride = c.req.query('host');
  const clientRange = c.req.header('range');
  const targetUrl = targetUrlRaw?.replaceAll(' ', '+') || null;

  if (!targetUrl || !isHttpUrl(targetUrl)) {
    return c.json(
      {
        success: false,
        message: 'invalid "url" query parameter (or use "u")',
      },
      400,
      proxyCorsHeaders
    );
  }

  const buildRequestHeaders = (requestReferer, includeOrigin) => {
    const requestHeaders = new Headers();
    requestHeaders.set('Accept', 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*');
    requestHeaders.set(
      'User-Agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    requestHeaders.set('Accept-Language', 'en-US,en;q=0.9');

    if (requestReferer) {
      requestHeaders.set('Referer', requestReferer);
      if (includeOrigin) {
        try {
          requestHeaders.set('Origin', new URL(requestReferer).origin);
        } catch {
          // noop
        }
      }
    }
    if (clientRange) {
      requestHeaders.set('Range', clientRange);
    }
    if (hostOverride) {
      try {
        requestHeaders.set('Host', hostOverride);
      } catch {
        // Some runtimes disallow host override, ignore safely.
      }
    }
    return requestHeaders;
  };

  const targetOriginReferer = (() => {
    try {
      return `${new URL(targetUrl).origin}/`;
    } catch {
      return null;
    }
  })();

  const normalizedInputReferer = (() => {
    try {
      return `${new URL(referer).origin}/`;
    } catch {
      return referer;
    }
  })();

  const fallbackAttempts = [
    { referer: normalizedInputReferer, includeOrigin: true },
    { referer: normalizedInputReferer, includeOrigin: false },
    { referer: targetOriginReferer, includeOrigin: true },
    { referer: targetOriginReferer, includeOrigin: false },
    { referer: 'https://hianime.to/', includeOrigin: true },
    { referer: 'https://hianime.to/', includeOrigin: false },
    { referer: 'https://hianime.sx/', includeOrigin: true },
    { referer: 'https://hianime.sx/', includeOrigin: false },
    { referer: 'https://megacloud.tv/', includeOrigin: true },
    { referer: 'https://megacloud.tv/', includeOrigin: false },
    { referer: null, includeOrigin: false },
  ];

  const fetchWithRedirects = async (url, headers, maxRedirects = 5) => {
    let currentUrl = url;
    let lastResponse = null;

    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers,
        redirect: 'manual',
      });

      lastResponse = response;
      if (response.status < 300 || response.status >= 400) {
        return response;
      }

      const location = response.headers.get('location');
      if (!location) {
        return response;
      }

      currentUrl = toAbsoluteUrl(location, currentUrl);
    }

    return lastResponse;
  };

  const seenAttempts = new Set();
  const uniqueAttempts = fallbackAttempts.filter((attempt) => {
    const key = attemptSignature(attempt);
    if (seenAttempts.has(key)) {
      return false;
    }
    seenAttempts.add(key);
    return true;
  });

  const targetHostKey = (() => {
    try {
      return new URL(targetUrl).host;
    } catch {
      return '';
    }
  })();
  const preferredSignature = targetHostKey ? preferredAttemptByHost.get(targetHostKey) : undefined;
  const orderedAttempts = preferredSignature
    ? [
        ...uniqueAttempts.filter((attempt) => attemptSignature(attempt) === preferredSignature),
        ...uniqueAttempts.filter((attempt) => attemptSignature(attempt) !== preferredSignature),
      ]
    : uniqueAttempts;

  let upstream = null;
  for (const attempt of orderedAttempts) {
    const response = await fetchWithRedirects(
      targetUrl,
      buildRequestHeaders(attempt.referer, attempt.includeOrigin)
    );

    upstream = response;
    if (response.ok && targetHostKey) {
      preferredAttemptByHost.set(targetHostKey, attemptSignature(attempt));
      if (preferredAttemptByHost.size > 200) {
        const oldestKey = preferredAttemptByHost.keys().next().value;
        preferredAttemptByHost.delete(oldestKey);
      }
    }
    if (response.ok || (response.status !== 403 && response.status !== 429)) {
      break;
    }
  }

  if (!upstream || !upstream.ok) {
    const status = upstream?.status || 502;
    return c.text(`upstream fetch failed (${status})`, status, proxyCorsHeaders);
  }

  const contentType = upstream.headers.get('content-type') || '';
  const responseHeaders = new Headers();
  if (contentType) {
    responseHeaders.set('Content-Type', contentType);
  }
  if (isVttUrl(targetUrl)) {
    // Some upstreams incorrectly return octet-stream for WebVTT; force correct type for HTML track parsing.
    responseHeaders.set('Content-Type', 'text/vtt; charset=utf-8');
  }
  const cacheControl = upstream.headers.get('cache-control');
  if (cacheControl) {
    responseHeaders.set('Cache-Control', cacheControl);
  }
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    responseHeaders.set('Content-Length', contentLength);
  }
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange);
  }
  const acceptRanges = upstream.headers.get('accept-ranges');
  if (acceptRanges) {
    responseHeaders.set('Accept-Ranges', acceptRanges);
  }
  applyProxyCorsHeaders(responseHeaders);

  if (targetUrl.includes('.m3u8') || isManifestContentType(contentType)) {
    const manifest = await upstream.text();
    const rewritten = rewriteManifest(manifest, targetUrl);
    if (!contentType) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    }
    return new Response(rewritten, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
