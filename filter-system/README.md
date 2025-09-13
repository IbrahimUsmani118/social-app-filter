# Bluesky Filter System

A comprehensive image upload filtering and duplicate detection system for Bluesky. This system prevents duplicate image uploads and provides advanced perceptual hashing capabilities.

## 🚀 Features

- **Duplicate Detection**: Advanced perceptual hashing to detect similar images across devices
- **Upload Limits**: Configurable maximum upload count per image (default: 3)
- **AWS Integration**: Uses S3 for storage and DynamoDB for metadata
- **Presigned URLs**: Secure direct-to-S3 uploads
- **Lambda Functions**: Serverless duplicate checking
- **Express Server**: RESTful API for image processing

## 📁 Project Structure

```
filter-system/
├── app.js                          # Main Express server
├── package.json                    # Dependencies and scripts
├── utils/
│   └── aws.js                      # AWS configuration and clients
├── apiHelpers/
│   └── getPresignedUrl.js          # Presigned URL helper
├── routes/
│   └── presign.js                  # Presigned URL routes
├── checkDuplicate/                 # Lambda function for duplicate detection
│   ├── index.js                    # Lambda handler
│   ├── imageHash.js                # Perceptual hashing algorithms
│   ├── package.json                # Lambda dependencies
│   └── deploy.sh                   # Deployment script
├── getImageUploadCount.js          # Upload count management
├── uploadService.js                # Upload service implementation
├── presignService.js               # Presigned URL service
├── presignedUploadService.js       # Presigned upload service
└── presign-server.js               # Legacy presign server
```

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   cd filter-system
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file with the following variables:
   ```bash
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_BUCKET=your-s3-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key

   # DynamoDB Configuration
   DYNAMODB_TABLE=ImageSignatures
   DYNAMODB_REGION=us-east-1

   # Server Configuration
   PORT=4000
   ```

3. **Set up AWS resources:**
   - Create an S3 bucket for image storage
   - Create a DynamoDB table named `ImageSignatures` with `ContentHash` as the primary key
   - Configure IAM roles with appropriate permissions

## 🚀 Usage

### Start the Server

```bash
npm start
# or for development
npm run dev
```

The server will start on `http://localhost:4000` by default.

### API Endpoints

- `GET /` - System information
- `GET /health` - Health check and configuration status
- `POST /presigned-url` - Get presigned URL for S3 upload

### Example Usage

#### Get Presigned URL

```bash
curl -X POST http://localhost:4000/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "image.jpg",
    "contentType": "image/jpeg",
    "method": "put"
  }'
```

#### Health Check

```bash
curl http://localhost:4000/health
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_BUCKET` | S3 bucket name | Required |
| `AWS_ACCESS_KEY_ID` | AWS access key | Optional (uses IAM role) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Optional (uses IAM role) |
| `DYNAMODB_TABLE` | DynamoDB table name | `ImageSignatures` |
| `PORT` | Server port | `4000` |

### DynamoDB Table Schema

```json
{
  "ContentHash": "string (primary key)",
  "UploadCount": "number",
  "LastUploaderId": "string",
  "LastUploaderName": "string",
  "LastUploadedAt": "number (timestamp)",
  "FileName": "string",
  "FirstUploaderId": "string",
  "FirstUploaderName": "string",
  "FirstUploadedAt": "number (timestamp)"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test the Lambda function
cd checkDuplicate
node test.js
```

## 🚀 Deployment

### Deploy Lambda Function

```bash
cd checkDuplicate
chmod +x deploy.sh
./deploy.sh
```

### Deploy Express Server

The Express server can be deployed to any Node.js hosting platform:

- AWS Elastic Beanstalk
- Heroku
- DigitalOcean App Platform
- Railway
- Render

## 🔍 Perceptual Hashing

The system uses advanced perceptual hashing algorithms:

1. **Average Hash**: Basic perceptual hash based on average brightness
2. **DCT Hash**: Discrete Cosine Transform-based hash for better accuracy
3. **Color Hash**: Color histogram-based hash for detecting color variations
4. **Combined Hash**: Multi-algorithm approach for robust detection

## 📊 Monitoring

Monitor the system using:

- AWS CloudWatch Logs
- AWS CloudWatch Metrics
- DynamoDB metrics
- S3 access logs

## 🐛 Troubleshooting

### Common Issues

1. **Configuration Errors**: Check environment variables and AWS credentials
2. **DynamoDB Permissions**: Ensure IAM role has DynamoDB access
3. **S3 Permissions**: Verify S3 bucket permissions
4. **Lambda Timeout**: Increase timeout for large images

### Debug Mode

Enable detailed logging by setting:
```bash
export LOG_LEVEL=DEBUG
```

## 📈 Performance

- **Cold Start**: ~2-3 seconds (Lambda)
- **Warm Start**: ~200-500ms
- **Memory Usage**: 128-512MB depending on image size
- **Timeout**: 30 seconds (configurable)

## 🔒 Security

- Uses AWS IAM roles for authentication
- No hardcoded credentials
- CORS headers for API Gateway integration
- Input validation for all parameters
- Presigned URLs with expiration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review AWS documentation for service-specific issues
