let API_KEY = '';
let MODEL_NAME = 'gemini-2.5-flash-lite';
let PROVIDER = 'gemini';
let PROMPTS = [];

const VALID_INPUT_TYPES = ['text', 'search', 'email', 'url', 'tel'];

const defaultPrompts = [
  { id: 'fix', heading: 'Fix Grammar', text: 'You are a precise grammar and spelling editor. Fix every grammar, spelling, punctuation, and syntax error in the text below. Do not change the meaning, tone, or style\u2014only correct mistakes. If the text has no errors, return it unchanged. If the input is gibberish or nonsensical, return exactly: INVALID\n\nCritical: Output ONLY the corrected text. No introductions, explanations, labels, or quotes.\n\n${text}' },
  { id: 'simplify', heading: 'Simplify', text: 'Rewrite the following text so a 10-year-old could understand it. Use short sentences, common everyday words, and simple structure. Preserve the full meaning\u2014do not omit any key points.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the simplified text. No introductions, explanations, labels, or quotes.\n\n${text}' },
  { id: 'professional', heading: 'Professional', text: 'Rewrite the following text in a polished, professional, business-ready tone. Use clear and confident language, proper grammar, and appropriate formality. Remove slang, filler, and overly casual expressions. The result should be suitable for an email to a client or senior executive.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the professional version. No introductions, explanations, labels, or quotes.\n\n${text}' },
  { id: 'casual', heading: 'Casual', text: 'Rewrite the following text in a warm, friendly, conversational tone\u2014like texting a close colleague. Use natural contractions, simple words, and a relaxed rhythm. Keep the meaning and all key points the same.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the casual version. No introductions, explanations, labels, or quotes.\n\n${text}' }
];

(async () => {
  try {
    const s = await chrome.storage.sync.get(['apiKey', 'modelName', 'prompts', 'provider']);
    API_KEY = s.apiKey || '';
    MODEL_NAME = s.modelName || 'gemini-2.5-flash-lite';
    PROVIDER = s.provider || 'gemini';
    PROMPTS = (s.prompts && s.prompts.length > 0) ? s.prompts : defaultPrompts;
  } catch (e) {
    PROMPTS = defaultPrompts;
  }
})();

chrome.storage.onChanged.addListener((changes, ns) => {
  if (ns !== 'sync') return;
  if (changes.apiKey) API_KEY = changes.apiKey.newValue || '';
  if (changes.modelName) MODEL_NAME = changes.modelName.newValue || 'gemini-2.5-flash-lite';
  if (changes.provider) PROVIDER = changes.provider.newValue || 'gemini';
  if (changes.prompts) PROMPTS = (changes.prompts.newValue && changes.prompts.newValue.length > 0) ? changes.prompts.newValue : defaultPrompts;
});

function findEditableElement(el) {
  let current = el;
  for (let i = 0; i < 5 && current; i++) {
    if (current.isContentEditable) return current;
    current = current.parentElement;
  }
  return null;
}

function resolveTarget(el) {
  const isInput = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && VALID_INPUT_TYPES.includes(el.type));
  if (isInput) return el;
  const editable = findEditableElement(el);
  if (editable) return editable;
  return el.isContentEditable ? el : null;
}

function getText(el) {
  return (el.value || el.innerText || '').trim();
}

document.addEventListener('input', (e) => {
  const el = resolveTarget(e.target);
  if (!el) return;
  if (getText(el).length > 0) {
    injectFixButton(el);
  } else {
    const old = document.getElementById('gemini-floating-container');
    if (old) old.remove();
  }
});

document.addEventListener('focusin', (e) => {
  const el = resolveTarget(e.target);
  if (el && getText(el).length === 0) {
    const old = document.getElementById('gemini-floating-container');
    if (old) old.remove();
  }
});

document.addEventListener('focusout', (e) => {
  const el = resolveTarget(e.target);
  if (!el) return;
  setTimeout(() => {
    const active = document.activeElement;
    const container = document.getElementById('gemini-floating-container');
    if (!container) return;
    // Keep icon if focus moved to the icon itself
    if (container.contains(active)) return;
    // Keep icon if focus stayed in the same target element
    const newTarget = resolveTarget(active);
    if (newTarget === el) return;
    container.remove();
  }, 150);
});



function showNotification(targetEl, icon, title, subtitle, type) {
  const existing = document.getElementById('twinwrite-warning');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'twinwrite-warning';
  el.className = 'twinwrite-warning';
  if (type === 'error') {
    el.style.background = '#2d1b1b';
    el.style.borderColor = '#ff6b6b';
    el.style.color = '#ffb4b4';
  }
  el.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${icon}</span>
      <div>
        <strong>${title}</strong><br>
        <span style="font-size: 11px;">${subtitle}</span>
      </div>
    </div>
  `;

  const rect = targetEl.getBoundingClientRect();
  el.style.position = 'absolute';
  el.style.top = `${window.scrollY + rect.top - 60}px`;
  el.style.left = `${window.scrollX + rect.left}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function injectFixButton(targetEl) {
  const oldBtn = document.getElementById('gemini-floating-container');
  if (oldBtn) oldBtn.remove();

  const container = document.createElement('div');
  container.id = 'gemini-floating-container';
  container.style.position = 'absolute';
  container.style.zIndex = '9999';

  if (!document.querySelector('link[href*="material-icons"]')) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <button id="gemini-fix-btn" class="gemini-fix-btn">
      <span class="material-icons">auto_awesome</span>
    </button>
  `;

  function updatePosition() {
    // If target element was removed from DOM, clean up
    if (!document.body.contains(targetEl)) {
      container.remove();
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    // Hide icon if target is scrolled out of view
    const inView = rect.bottom > 0 && rect.top < window.innerHeight &&
      rect.right > 0 && rect.left < window.innerWidth;
    container.style.display = inView ? '' : 'none';
    if (inView) {
      container.style.top = `${window.scrollY + rect.top - 35}px`;
      container.style.left = `${window.scrollX + rect.right - 60}px`;
    }
  }

  updatePosition();
  document.body.appendChild(container);

  const positionUpdater = () => updatePosition();
  window.addEventListener('scroll', positionUpdater, true);
  window.addEventListener('resize', positionUpdater);

  // Watch for target element being removed from the DOM
  const domObserver = new MutationObserver(() => {
    if (!document.body.contains(targetEl)) {
      container.remove();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  const originalRemove = container.remove.bind(container);
  container.remove = function () {
    window.removeEventListener('scroll', positionUpdater, true);
    window.removeEventListener('resize', positionUpdater);
    domObserver.disconnect();
    originalRemove();
  };

  const fixBtn = document.getElementById('gemini-fix-btn');

  fixBtn.onclick = async () => {
    await processText(targetEl, fixBtn, container, PROMPTS.find(p => p.id === 'fix') || PROMPTS[0]);
  };

  fixBtn.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, targetEl, fixBtn, container);
  };
}

function showContextMenu(e, targetEl, fixBtn, container) {
  const oldMenu = document.getElementById('gemini-context-menu');
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'gemini-context-menu';
  menu.className = 'gemini-context-menu';
  menu.innerHTML = PROMPTS.map((p, i) => `<div class="gemini-menu-item" data-index="${i}">${p.heading}</div>`).join('');
  menu.style.position = 'absolute';
  menu.style.left = `${e.pageX}px`;
  menu.style.top = `${e.pageY}px`;
  document.body.appendChild(menu);

  menu.querySelectorAll('.gemini-menu-item').forEach(item => {
    item.onclick = async () => {
      const promptObj = PROMPTS[parseInt(item.dataset.index, 10)];
      menu.remove();
      await processText(targetEl, fixBtn, container, promptObj);
    };
  });

  setTimeout(() => {
    document.addEventListener('click', function close() {
      const m = document.getElementById('gemini-context-menu');
      if (m) m.remove();
      document.removeEventListener('click', close);
    }, { once: true });
  }, 100);
}

async function processText(targetEl, fixBtn, container, promptObj) {
  const originalText = getText(targetEl);
  if (!originalText) return;

  if (!API_KEY) {
    showNotification(targetEl, '\u26a0\ufe0f', 'API Key Required', 'Click the TwinWrite icon to configure', 'warn');
    container.remove();
    return;
  }

  fixBtn.classList.add('processing');
  fixBtn.disabled = true;

  try {
    const result = await callAPI(originalText, promptObj);
    if (result === 'INVALID') { container.remove(); return; }

    if (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA') {
      targetEl.value = result;
    } else {
      targetEl.innerText = result;
    }
    setTimeout(() => container.remove(), 300);
  } catch (err) {
    container.remove();
    const msg = err.message || 'Unknown error';
    if (msg.includes('401') || msg.includes('403')) {
      showNotification(targetEl, '\ud83d\udd11', 'Invalid API Key', 'Check your key in TwinWrite settings', 'error');
    } else if (msg.includes('429')) {
      showNotification(targetEl, '\u23f3', 'Rate Limited', 'Too many requests \u2014 wait a moment', 'error');
    } else if (msg.includes('404')) {
      showNotification(targetEl, '\u2699\ufe0f', 'Model Not Found', `"${MODEL_NAME}" is not valid`, 'error');
    } else if (msg.includes('No response')) {
      showNotification(targetEl, '\ud83d\udeab', 'Blocked', 'The model refused to process this text', 'error');
    } else {
      showNotification(targetEl, '\u274c', 'Request Failed', msg.length > 60 ? msg.slice(0, 60) + '\u2026' : msg, 'error');
    }
  }
}

async function callAPI(text, promptObj) {
  const prompt = promptObj.text.replace('${text}', text);
  return PROVIDER === 'openai' ? callOpenAI(prompt) : callGemini(prompt);
}

async function callGemini(prompt) {
  let response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
  } catch (_) {
    throw new Error('Network error \u2014 check your connection');
  }

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  const data = await response.json();
  if (!data.candidates || !data.candidates.length) throw new Error('No response from model');

  const candidate = data.candidates[0];
  if (candidate.finishReason === 'SAFETY') throw new Error('No response \u2014 blocked by safety filters');
  if (!candidate.content?.parts?.length) throw new Error('No response from model');

  return candidate.content.parts[0].text.trim();
}

async function callOpenAI(prompt) {
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
  } catch (_) {
    throw new Error('Network error \u2014 check your connection');
  }

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  const data = await response.json();
  if (!data.choices || !data.choices.length) throw new Error('No response from model');

  const message = data.choices[0].message;
  if (!message || !message.content) throw new Error('No response from model');

  return message.content.trim();
}