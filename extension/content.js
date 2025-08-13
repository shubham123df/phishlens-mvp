// content.js
// Runs on every page, asks background to check the current URL, shows a full-page warning overlay if suspicious.

(function() {
  // don't run inside frames
  if (window.top !== window) return;

  // skip some built-in protocols
  const skipProtocols = ['chrome:', 'about:', 'edge:', 'file:'];
  try {
    if (skipProtocols.includes(location.protocol)) return;
  } catch (e) {
    return;
  }

  const CACHE_KEY = 'phishlens_checked_hosts';

  function getStorage() {
    return new Promise(resolve => chrome.storage.local.get([CACHE_KEY], items => resolve(items[ CACHE_KEY ] || {})));
  }
  function setStorage(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, () => resolve()));
  }

  async function main() {
    const host = location.hostname;
    // load cached checks
    let cached = await getStorage();
    if (cached && cached[host] && (Date.now() - cached[host].ts) < 5*60*1000) {
      if (cached[host].data && cached[host].data.prediction === 1) {
        showWarning(cached[host].data);
      }
      return;
    }

    // Ask background to check
    chrome.runtime.sendMessage({ type: 'CHECK_URL', url: location.href }, (resp) => {
      try {
        if (!resp) return;
        if (resp.ok && resp.data) {
          cached = cached || {};
          cached[host] = { ts: Date.now(), data: resp.data };
          setStorage({ [CACHE_KEY]: cached });
          if (resp.data.prediction === 1) {
            showWarning(resp.data);
          }
        } else {
          // backend unreachable => quietly fail (do nothing)
          // console.warn('PhishLens check failed', resp && resp.error);
        }
      } catch (e) {
        console.error('PhishLens content script error', e);
      }
    });
  }

  // Create and show overlay
  function showWarning(data) {
    if (document.getElementById('phishlens-overlay')) return;

    const probability = Math.round(((data.probability || data.score || 0) * 100));

    const overlay = document.createElement('div');
    overlay.id = 'phishlens-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.88)';
    overlay.style.zIndex = '2147483647';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(3px)';

    const box = document.createElement('div');
    box.style.maxWidth = '800px';
    box.style.width = '90%';
    box.style.background = '#fff';
    box.style.borderRadius = '12px';
    box.style.padding = '20px';
    box.style.boxSizing = 'border-box';
    box.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
    box.style.color = '#111';
    box.style.textAlign = 'left';

    box.innerHTML = `
      <h2 style="margin:0 0 8px;">🚨 PhishLens Warning</h2>
      <p style="margin:0 0 12px;">This page looks suspicious. Risk: <strong>${probability}%</strong></p>
      <p style="margin:0 0 12px;font-size:13px;color:#333;word-break:break-all;"><em>${data.url || location.href}</em></p>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="phish-proceed" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer;">Proceed (unsafe)</button>
        <button id="phish-back" style="padding:8px 14px;border-radius:8px;border:0;background:#e63946;color:white;cursor:pointer;">Go back</button>
      </div>
      <p style="margin-top:12px;font-size:12px;color:#666;">If you think this is a false positive, you can report the URL from the PhishLens site.</p>
    `;

    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    document.getElementById('phish-back').addEventListener('click', () => {
      // try safe go-back, if not possible then open about:blank
      try { history.back(); } catch (e) { location.href = 'about:blank'; }
    });
    document.getElementById('phish-proceed').addEventListener('click', () => {
      overlay.remove(); // allow page
    });
  }

  // start
  main();
})();

