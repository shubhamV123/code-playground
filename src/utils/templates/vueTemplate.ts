import { type Template } from "./types";

export const vueTemplate: Template = {
  id: "vue",
  name: "Vue 3",
  description: "Vue 3 with Composition API and reactive state",
  icon: "vue",
  packages: {
    vue: "3.5.13",
  },
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
    <title>Vue 3 Playground</title>
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
          content: `import { h, ref, computed } from 'vue';
import './styles.css';

export default {
  name: 'App',
  setup() {
    const count = ref(0);
    const name = ref('');
    const submitted = ref(false);

    const doubleCount = computed(() => count.value * 2);

    const increment = () => {
      count.value++;
    };

    const decrement = () => {
      count.value--;
    };

    const reset = () => {
      count.value = 0;
    };

    const handleSubmit = () => {
      if (name.value.trim()) {
        submitted.value = true;
        setTimeout(() => {
          submitted.value = false;
        }, 3000);
      }
    };

    return {
      count,
      name,
      submitted,
      doubleCount,
      increment,
      decrement,
      reset,
      handleSubmit
    };
  },
  render() {
    return h('div', { class: 'app' }, [
      h('h1', 'Welcome to Vue 3 Playground'),
      h('p', 'Edit the code and see changes instantly!'),

      this.submitted && h('div', { class: 'alert' }, [
        h('p', \`✅ Form submitted! Hello, \${this.name || 'Guest'}!\`)
      ]),

      h('div', { class: 'card' }, [
        h('h2', \`Counter: \${this.count}\`),
        h('p', { class: 'computed' }, \`Double: \${this.doubleCount}\`),
        h('div', { class: 'button-group' }, [
          h('button', { onClick: this.increment }, 'Increment'),
          h('button', { onClick: this.decrement }, 'Decrement'),
          h('button', { onClick: this.reset }, 'Reset')
        ])
      ]),

      h('div', { class: 'card' }, [
        h('h2', 'Input Form'),
        h('div', { class: 'input-group' }, [
          h('input', {
            type: 'text',
            placeholder: 'Enter your name',
            value: this.name,
            onInput: (e) => { this.name = e.target.value; },
            onKeyup: (e) => { if (e.key === 'Enter') this.handleSubmit(); }
          }),
          h('button', {
            onClick: this.handleSubmit,
            disabled: !this.name.trim()
          }, 'Submit')
        ]),
        this.name && h('p', { class: 'preview' }, \`Preview: \${this.name}\`)
      ]),

      h('div', { class: 'info' }, [
        h('p', '✨ Start building your Vue 3 app'),
        h('p', '📦 Install packages using the Dependencies panel'),
        h('p', '🎨 Using Composition API for reactive state')
      ])
    ]);
  }
};`,
        },
        "index.js": {
          type: "file",
          name: "index.js",
          content: `import { createApp } from 'vue';
import App from './App';

// Handle HMR: unmount existing app and clear DOM
const container = document.getElementById('root');

if (window.__vueApp) {
  // Unmount the existing Vue app
  window.__vueApp.unmount();
  window.__vueApp = null;
}

// Clear the container's innerHTML to ensure clean mount
// Vue 3 replaces innerHTML on mount, but we need a clean slate
if (container) {
  container.innerHTML = '';
}

// Create and mount the new app
const app = createApp(App);
window.__vueApp = app;
app.mount('#root');`,
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
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
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
  color: #42b883;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

h2 {
  color: #35495e;
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
  color: #42b883;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  text-align: center;
}

.computed {
  text-align: center;
  color: #35495e;
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
  background: #42b883;
  color: white;
}

button:hover:not(:disabled) {
  background: #35a372;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
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
  border-color: #42b883;
}

.preview {
  margin-top: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #42b883;
  color: #35495e;
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
  "name": "vue-playground",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "vue": "3.5.13"
  }
}`,
    },
  },
};
