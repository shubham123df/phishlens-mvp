// background.js
// Receives messages from content scripts, calls the local ML backend, caches results, returns JSON.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const cache = {}; // by host -> { ts, data }

function hostFromUrl(url) {
  try { return new URL(url).hostname; } catch(e){ return url; }
}

async function fetchWithTimeout(url, opts = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {...opts, signal: controller.signal});
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Listen for messages from content scripts:
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'CHECK_URL') return;
  const url = msg.url;
  const host = hostFromUrl(url);
  const now = Date.now();

  // Return cached
  if (cache[host] && (now - cache[host].ts) < CACHE_TTL_MS) {
    sendResponse({ ok: true, data: cache[host].data });
    return true;
  }

  (async () => {
    try {
      const res = await fetchWithTimeout('http://127.0.0.1:5000/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }, 3000);

      if (!res.ok) throw new Error('backend error ' + res.status);
      const data = await res.json();
      cache[host] = { ts: Date.now(), data };
      sendResponse({ ok: true, data });
    } catch (err) {
      console.warn('PhishLens background fetch failed:', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true; // indicate async sendResponse
});

