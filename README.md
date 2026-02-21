# TwinWrite

**AI-powered writing assistant for Chrome/Edge browsers**

TwinWrite is a lightweight browser extension that transforms your text using **Google Gemini** or **OpenAI**. Fix grammar, adjust tone, shorten or expand — right from any text field on any website.

## Features

- ✨ **Fix Grammar** — Correct spelling, grammar, and punctuation
- 🎯 **Simplify** — Rewrite for clarity and readability
- 👔 **Professional** — Convert to polished business tone
- ☕ **Casual** — Make text warm and conversational
- ⚙️ **Custom Prompts** — Add your own transformation modes

## Installation

1. Clone or download this repository
2. Open Chrome or Edge → navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** → select the `TwinWrite` folder
5. Click the TwinWrite icon in your toolbar to configure

## Setup

1. Get a free API key:
   - **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click the **TW** icon in your browser toolbar
3. Select your **Provider** (Gemini or OpenAI)
4. Paste your API key and click **Save Changes**

## Usage

| Action | How |
|---|---|
| Quick grammar fix | **Left-click** the ✨ button on any text field |
| All transformation modes | **Right-click** the ✨ button |
| Edit prompts & settings | Click the **TW** extension icon |

Works on standard text inputs, textareas, and most contentEditable elements.

**Note:** Some websites use custom editor frameworks that prevent TwinWrite from detecting or modifying text. This is a known limitation.

## Project Structure

```
TwinWrite/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — shortcut & icon click handling
├── content.js         # Core logic — text detection, API calls, UI injection
├── styles.css         # Injected styles for the floating button & menu
├── options.html       # Full-page settings & prompt editor
├── options.js         # Settings page logic
├── icon16.png         # Toolbar icon
├── icon48.png         # Extension management icon
└── icon128.png        # Chrome Web Store icon
```

## Tech Stack

- Vanilla JavaScript — zero dependencies
- Chrome Extension Manifest V3
- Google Gemini API & OpenAI API (REST)
- Google Material Icons (loaded at runtime)

## Privacy

- Your API key is stored locally in Chrome sync storage
- Text is sent directly to Google's Gemini API for processing
- TwinWrite collects **zero** data — no analytics, no tracking, no servers

## License

[MIT](LICENSE) — free to use, modify, and distribute.

## Contributing

Issues and pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.
# TwinWrite
