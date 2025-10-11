import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

/**
 * MUI Demo Component
 * Tests Material UI v7 components to verify external package installation
 */
export default function MuiDemo() {
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
      <Stack spacing={3} maxWidth="800px" margin="0 auto">
        {/* Header */}
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Material UI Demo
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Testing external package installation with @mui/material
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
            Form submitted successfully! Hello, {name || 'Guest'}!
          </Alert>
        )}

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
                helperText="This is a Material UI TextField component"
              />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Selected name: {name || 'None'}
                </Typography>
              </Box>
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

        {/* Button Variants Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Button Variants
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
              <Button variant="contained">Contained</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
              <Button variant="contained" color="secondary">
                Secondary
              </Button>
              <Button variant="contained" color="success">
                Success
              </Button>
              <Button variant="contained" color="error">
                Error
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Chips Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Chips
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Chip label="React" color="primary" />
              <Chip label="Material UI" color="secondary" />
              <Chip label="TypeScript" color="success" />
              <Chip label="Vite" color="info" />
              <Chip label="Clickable" onClick={() => alert('Chip clicked!')} />
              <Chip label="Deletable" onDelete={() => alert('Delete clicked!')} />
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
              <Typography variant="body1">
                ✅ @mui/material - Successfully loaded
              </Typography>
              <Typography variant="body1">
                ✅ @emotion/react - Successfully loaded
              </Typography>
              <Typography variant="body1">
                ✅ @emotion/styled - Successfully loaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                If you can see this page with all components styled correctly,
                your package manager is working perfectly!
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
