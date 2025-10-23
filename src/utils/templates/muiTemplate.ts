import { type Template } from "./types";

export const muiTemplate: Template = {
  id: "mui",
  name: "Material UI",
  description: "React with Material UI components and theming",
  icon: "mui",
  packages: {
    react: "19.1.1",
    "react-dom": "19.1.1",
    "@mui/material": "7.3.4",
    "@emotion/react": "11.14.0",
    "@emotion/styled": "11.14.1",
  },
  defaultActiveFile: "src/App.jsx",
  files: {
    "index.html": {
      type: "file",
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Material UI Playground</title>
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
import {
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: darkMode ? '#1e1e1e' : '#f5f5f5',
        color: darkMode ? '#fff' : '#000',
        padding: 4,
        transition: 'all 0.3s ease',
      }}
    >
      <Stack spacing={3} maxWidth="900px" margin="0 auto">
        {/* Header */}
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Material UI Playground
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Edit the code and see changes instantly!
          </Typography>
        </Box>

        {/* Dark Mode Toggle */}
        <Card>
          <CardContent>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              }
              label="Dark Mode"
            />
          </CardContent>
        </Card>

        {/* Alert */}
        {showAlert && (
          <Alert severity="success" onClose={() => setShowAlert(false)}>
            Form submitted! Hello, {name || 'Guest'}!
          </Alert>
        )}

        {/* Counter Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Counter Demo
            </Typography>
            <Typography variant="h2" component="div" sx={{ my: 3, fontWeight: 'bold', color: 'primary.main' }}>
              {count}
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="contained" onClick={() => setCount(count + 1)}>
              Increment
            </Button>
            <Button variant="outlined" onClick={() => setCount(count - 1)}>
              Decrement
            </Button>
            <Button color="error" onClick={() => setCount(0)}>
              Reset
            </Button>
          </CardActions>
        </Card>

        {/* Input Form Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Input Form
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Enter your name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                helperText="Material UI TextField component"
              />
            </Stack>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              Submit
            </Button>
            <Button variant="outlined" onClick={() => setName('')}>
              Clear
            </Button>
          </CardActions>
        </Card>

        {/* Chips Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Technology Stack
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip label="React 18" color="primary" />
              <Chip label="Material UI v6" color="secondary" />
              <Chip label="Emotion" color="success" />
              <Chip label="ESBuild" color="info" />
            </Stack>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Installation Status
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body1">✅ @mui/material - Loaded</Typography>
              <Typography variant="body1">✅ @emotion/react - Loaded</Typography>
              <Typography variant="body1">✅ @emotion/styled - Loaded</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                All Material UI components are working! Try editing the code to see live updates.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  margin: 0;
}`,
        },
      },
    },
    "package.json": {
      type: "file",
      name: "package.json",
      content: `{
  "name": "mui-playground",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "@mui/material": "7.3.4",
    "@emotion/react": "11.14.0",
    "@emotion/styled": "11.14.1"
  }
}`,
    },
  },
};
