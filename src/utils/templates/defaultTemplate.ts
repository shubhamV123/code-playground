import { type Template } from "./types";

export const defaultTemplate: Template = {
  id: "react",
  name: "React",
  description: "Plain React application with basic counter example",
  icon: "⚛️",
  packages: {
    react: "18.3.1",
    "react-dom": "18.3.1",
  },
  files: {
    "index.html": {
      type: "file",
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Playground</title>
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
        "App.jsx": {
          type: "file",
          name: "App.jsx",
          content: `import { useState } from 'react';
import './styles.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Welcome to React Playground</h1>
      <p>Edit the code and see changes instantly!</p>

      <div className="card">
        <h2>Counter: {count}</h2>
        <div className="button-group">
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
          <button onClick={() => setCount(count - 1)}>
            Decrement
          </button>
          <button onClick={() => setCount(0)}>
            Reset
          </button>
        </div>
      </div>

      <div className="info">
        <p>✨ Start building your React app</p>
        <p>📦 Install packages using the Dependencies panel</p>
        <p>🎨 Choose from templates to get started faster</p>
      </div>
    </div>
  );
}

export default App;`,
        },
        "index.jsx": {
          type: "file",
          name: "index.jsx",
          content: `import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
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
  // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app {
  max-width: 600px;
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

p {
  color: #666;
  line-height: 1.6;
}

.card {
  margin: 2rem 0;
  padding: 2rem;
  background: #f7f7f7;
  border-radius: 8px;
  text-align: center;
}

.card h2 {
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 2.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
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
  "name": "react-playground",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}`,
    },
  },
};
