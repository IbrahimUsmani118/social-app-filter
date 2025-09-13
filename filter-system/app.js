import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import presignRouter from './routes/presign.js';
import { validateAwsConfig, getAwsConfigDebug } from './utils/aws-simple.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/presigned-url', presignRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  const configValidation = validateAwsConfig();
  const debugInfo = getAwsConfigDebug();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: debugInfo,
    validation: configValidation,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Bluesky Filter System',
    version: '1.0.0',
    description: 'Image upload filtering and duplicate detection system',
    endpoints: {
      health: '/health',
      presignedUrl: '/presigned-url',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ [app] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Filter system server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET  / - System information');
  console.log('  GET  /health - Health check');
  console.log('  POST /presigned-url - Get presigned URL for S3 upload');
  
  // Validate configuration on startup
  const configValidation = validateAwsConfig();
  if (!configValidation.isValid) {
    console.warn('⚠️ Configuration issues:');
    configValidation.errors.forEach(error => console.warn(`  - ${error}`));
  } else {
    console.log('✅ Configuration validated successfully');
  }
});

export default app; 