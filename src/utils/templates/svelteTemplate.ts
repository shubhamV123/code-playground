import { type Template } from "./types";

export const svelteTemplate: Template = {
  id: "svelte",
  name: "Svelte",
  description: "Svelte-inspired reactive JavaScript template",
  icon: "svelte",
  packages: {},
  defaultActiveFile: "src/App.js",
  files: {
    "index.html": {
      type: "file",
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Svelte Playground</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    },
    src: {
      type: "folder",
      name: "src",
      children: {
        "App.js": {
          type: "file",
          name: "App.js",
          content: `import './styles.css';

// Simple reactive state using plain JavaScript
export function createApp(target) {
  let state = {
    count: 0,
    name: '',
    submitted: false
  };

  function increment() {
    state.count++;
    render();
  }

  function decrement() {
    state.count--;
    render();
  }

  function reset() {
    state.count = 0;
    render();
  }

  function handleSubmit() {
    if (state.name && state.name.trim()) {
      state.submitted = true;
      render();
      setTimeout(() => {
        state.submitted = false;
        render();
      }, 3000);
    }
  }

  function handleNameInput(e) {
    state.name = e.target.value;
    render();
  }

  function render() {
    const doubleCount = state.count * 2;

    target.innerHTML = \`
      <div class="app">
        <h1>Welcome to Svelte Playground</h1>
        <p>Edit the code and see changes instantly!</p>

        \${state.submitted ? \`
          <div class="alert">
            <p>✅ Form submitted! Hello, \${state.name || 'Guest'}!</p>
          </div>
        \` : ''}

        <div class="card">
          <h2>Counter: \${state.count}</h2>
          <p class="computed">Double: \${doubleCount}</p>
          <div class="button-group">
            <button id="increment-btn">Increment</button>
            <button id="decrement-btn">Decrement</button>
            <button id="reset-btn">Reset</button>
          </div>
        </div>

        <div class="card">
          <h2>Input Form</h2>
          <div class="input-group">
            <input
              id="name-input"
              type="text"
              placeholder="Enter your name"
              value="\${state.name}"
            />
            <button id="submit-btn" \${!state.name.trim() ? 'disabled' : ''}>
              Submit
            </button>
          </div>
          \${state.name ? \`<p class="preview">Preview: \${state.name}</p>\` : ''}
        </div>

        <div class="info">
          <p>✨ Start building your Svelte app</p>
          <p>📦 Install packages using the Dependencies panel</p>
          <p>🔥 This example uses plain JavaScript</p>
          <p>💡 You can add Svelte stores for more advanced reactivity</p>
        </div>
      </div>
    \`;

    // Attach event listeners
    const incrementBtn = target.querySelector('#increment-btn');
    const decrementBtn = target.querySelector('#decrement-btn');
    const resetBtn = target.querySelector('#reset-btn');
    const submitBtn = target.querySelector('#submit-btn');
    const nameInput = target.querySelector('#name-input');

    if (incrementBtn) incrementBtn.addEventListener('click', increment);
    if (decrementBtn) decrementBtn.addEventListener('click', decrement);
    if (resetBtn) resetBtn.addEventListener('click', reset);
    if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    if (nameInput) {
      nameInput.addEventListener('input', handleNameInput);
      nameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });
    }
  }

  // Initial render
  render();
}`,
        },
        "index.js": {
          type: "file",
          name: "index.js",
          content: `import { createApp } from './App.js';

// Get the root element
const root = document.getElementById('root');

// Create and render the app
if (root) {
  createApp(root);
}`,
        },
        "styles.css": {
          type: "file",
          name: "styles.css",
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #ff3e00 0%, #f9f9f9 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.app {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #ff3e00;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

p {
  color: #666;
  line-height: 1.6;
}

.alert {
  margin: 1rem 0;
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  color: #155724;
}

.card {
  margin: 2rem 0;
  padding: 2rem;
  background: #f7f7f7;
  border-radius: 8px;
}

.card h2 {
  color: #ff3e00;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  text-align: center;
}

.computed {
  text-align: center;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #ff3e00;
  color: white;
}

button:hover:not(:disabled) {
  background: #e63900;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 62, 0, 0.4);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #ff3e00;
}

.preview {
  margin-top: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #ff3e00;
  color: #333;
  font-weight: 500;
}

.info {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.info p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}`,
        },
      },
    },
    "package.json": {
      type: "file",
      name: "package.json",
      content: `{
  "name": "svelte-playground",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {}
}`,
    },
  },
};
