// Minimal test server to isolate the issue
import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Minimal server works!',
    timestamp: new Date().toISOString(),
  });
});

export default app;

