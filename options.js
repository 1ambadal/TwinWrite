const defaultPrompts = [
    { id: 'fix', heading: 'Fix Grammar', text: 'You are a precise grammar and spelling editor. Fix every grammar, spelling, punctuation, and syntax error in the text below. Do not change the meaning, tone, or style\u2014only correct mistakes. If the text has no errors, return it unchanged. If the input is gibberish or nonsensical, return exactly: INVALID\n\nCritical: Output ONLY the corrected text. No introductions, explanations, labels, or quotes.\n\n${text}' },
    { id: 'simplify', heading: 'Simplify', text: 'Rewrite the following text so a 10-year-old could understand it. Use short sentences, common everyday words, and simple structure. Preserve the full meaning\u2014do not omit any key points.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the simplified text. No introductions, explanations, labels, or quotes.\n\n${text}' },
    { id: 'professional', heading: 'Professional', text: 'Rewrite the following text in a polished, professional, business-ready tone. Use clear and confident language, proper grammar, and appropriate formality. Remove slang, filler, and overly casual expressions. The result should be suitable for an email to a client or senior executive.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the professional version. No introductions, explanations, labels, or quotes.\n\n${text}' },
    { id: 'casual', heading: 'Casual', text: 'Rewrite the following text in a warm, friendly, conversational tone\u2014like texting a close colleague. Use natural contractions, simple words, and a relaxed rhythm. Keep the meaning and all key points the same.\n\nIf the input is gibberish, return exactly: INVALID\n\nCritical: Output ONLY the casual version. No introductions, explanations, labels, or quotes.\n\n${text}' }
];

let currentPrompts = [];

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById('save-btn').addEventListener('click', saveOptions);
document.getElementById('add-prompt-btn').addEventListener('click', addPromptField);
document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
document.getElementById('provider').addEventListener('change', onProviderChange);

const providerDefaults = {
    gemini: { model: 'gemini-2.5-flash-lite', placeholder: 'gemini-2.5-flash-lite', help: 'Google Gemini model name.' },
    openai: { model: 'gpt-4o-mini', placeholder: 'gpt-4o-mini', help: 'OpenAI model name (e.g. gpt-4o, gpt-4o-mini).' }
};

function onProviderChange() {
    const provider = document.getElementById('provider').value;
    const defaults = providerDefaults[provider];
    const modelInput = document.getElementById('modelName');
    modelInput.placeholder = defaults.placeholder;
    document.getElementById('modelHelp').textContent = defaults.help;
    if (!modelInput.value || Object.values(providerDefaults).some(d => d.model === modelInput.value)) {
        modelInput.value = defaults.model;
    }
}

function restoreOptions() {
    chrome.storage.sync.get(['apiKey', 'modelName', 'prompts', 'provider'], (items) => {
        const provider = items.provider || 'gemini';
        document.getElementById('provider').value = provider;
        document.getElementById('apiKey').value = items.apiKey || '';
        document.getElementById('modelName').value = items.modelName || providerDefaults[provider].model;
        document.getElementById('modelName').placeholder = providerDefaults[provider].placeholder;
        document.getElementById('modelHelp').textContent = providerDefaults[provider].help;

        currentPrompts = items.prompts;
        if (!currentPrompts || !Array.isArray(currentPrompts) || currentPrompts.length === 0) {
            currentPrompts = JSON.parse(JSON.stringify(defaultPrompts));
        }

        renderPrompts();
    });
}

function renderPrompts() {
    const container = document.getElementById('prompts-container');
    container.innerHTML = '';

    currentPrompts.forEach((prompt, index) => {
        const promptEl = document.createElement('div');
        promptEl.className = 'prompt-item';
        promptEl.dataset.index = index;

        promptEl.innerHTML = `
      <div class="prompt-header">
        <div class="prompt-number">${index + 1}</div>
        <div class="form-group">
          <label>Heading</label>
          <input type="text" class="prompt-heading" value="${escapeHtml(prompt.heading)}" placeholder="e.g. Fix Grammar">
        </div>
        <button class="btn btn-icon remove-prompt-btn" title="Delete">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Prompt</label>
        <textarea class="prompt-text" placeholder="Use \${text} where the selected text should go...">${escapeHtml(prompt.text)}</textarea>
      </div>
    `;

        promptEl.querySelector('.remove-prompt-btn').addEventListener('click', () => {
            currentPrompts.splice(index, 1);
            renderPrompts();
        });

        container.appendChild(promptEl);
    });
}

function addPromptField() {
    currentPrompts.push({
        id: 'custom-' + Date.now(),
        heading: 'New Action',
        text: 'Process this text:\n\n"${text}"\n\nOutput:'
    });
    renderPrompts();
}

function resetToDefaults() {
    if (confirm('Are you sure you want to reset all prompts to defaults? Custom prompts will be lost.')) {
        currentPrompts = JSON.parse(JSON.stringify(defaultPrompts));
        renderPrompts();
    }
}

function saveOptions() {
    const provider = document.getElementById('provider').value;
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelName = document.getElementById('modelName').value.trim() || providerDefaults[provider].model;

    const container = document.getElementById('prompts-container');
    const promptItems = container.querySelectorAll('.prompt-item');

    const updatedPrompts = [];
    let index = 0;
    for (const item of promptItems) {
        const heading = item.querySelector('.prompt-heading').value.trim();
        const text = item.querySelector('.prompt-text').value.trim();

        if (heading && text) {
            let id = currentPrompts[index] ? currentPrompts[index].id : 'custom-' + Date.now();
            updatedPrompts.push({ id, heading, text });
            index++;
        }
    }

    currentPrompts = updatedPrompts;

    chrome.storage.sync.set({
        provider,
        apiKey,
        modelName,
        prompts: currentPrompts
    }, () => {
        showToast('Settings saved successfully!', 'success');
        renderPrompts();
    });
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
