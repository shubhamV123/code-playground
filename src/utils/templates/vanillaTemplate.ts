import { type Template } from "./types";

export const vanillaTemplate: Template = {
  id: "vanilla",
  name: "Vanilla JS",
  description: "Plain HTML, CSS, and JavaScript - no frameworks",
  icon: "javascript",
  packages: {},
  defaultActiveFile: "src/index.js",
  files: {
    "index.html": {
      type: "file",
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla JS Playground</title>
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
        "index.js": {
          type: "file",
          name: "index.js",
          content: `import './styles.css';

// Get the root container
const root = document.getElementById('root');

// Create the main app structure
root.innerHTML = \`
  <div class="container">
    <h1>Welcome to Vanilla JS Playground</h1>
    <p>Pure HTML, CSS, and JavaScript - no frameworks needed!</p>

    <div class="card">
      <h2>Counter: <span id="counter">0</span></h2>
      <div class="button-group">
        <button id="increment">Increment</button>
        <button id="decrement">Decrement</button>
        <button id="reset">Reset</button>
      </div>
    </div>

    <div class="card">
      <h2>Color Picker</h2>
      <div class="color-picker">
        <input type="color" id="colorPicker" value="#667eea" />
        <div id="colorDisplay" class="color-display"></div>
      </div>
      <p>Selected: <code id="colorValue">#667eea</code></p>
    </div>

    <div class="info">
      <p>✨ Edit the code and see changes instantly</p>
      <p>🎨 No build tools, no dependencies - just vanilla JS</p>
      <p>📦 Add npm packages if you need them</p>
    </div>
  </div>
\`;

// Counter functionality
let count = 0;
const counterDisplay = document.getElementById('counter');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const resetBtn = document.getElementById('reset');

function updateCounter() {
  counterDisplay.textContent = count;
}

incrementBtn.addEventListener('click', () => {
  count++;
  updateCounter();
});

decrementBtn.addEventListener('click', () => {
  count--;
  updateCounter();
});

resetBtn.addEventListener('click', () => {
  count = 0;
  updateCounter();
});

// Color picker functionality
const colorPicker = document.getElementById('colorPicker');
const colorDisplay = document.getElementById('colorDisplay');
const colorValue = document.getElementById('colorValue');

function updateColor(color) {
  colorDisplay.style.backgroundColor = color;
  colorValue.textContent = color;
}

// Initialize color display
updateColor(colorPicker.value);

colorPicker.addEventListener('input', (e) => {
  updateColor(e.target.value);
});

console.log('🎉 Vanilla JS app initialized!');`,
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

h2 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.card {
  margin: 2rem 0;
  padding: 2rem;
  background: #f7f7f7;
  border-radius: 8px;
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
  background: #667eea;
  color: white;
}

button:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:active {
  transform: translateY(0);
}

.color-picker {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin: 1rem 0;
}

#colorPicker {
  width: 80px;
  height: 80px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-display {
  flex: 1;
  height: 80px;
  border-radius: 8px;
  border: 2px solid #ddd;
  transition: background-color 0.3s;
}

code {
  background: #e8e8e8;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
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
  },
};
