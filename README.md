# Challenge Advisor

Skeleton project for an automated feedback system for Python assignments.

## Local Development

### Requirements
- Python 3.11
- Node.js (for Serverless Framework and React frontend)
- Docker (used to sandbox user code)

### Backend
1. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Install the Serverless CLI and DynamoDB local plugin:
   ```bash
   npm install -g serverless serverless-dynamodb-local
   ```
3. Download DynamoDB Local (only once):
   ```bash
   serverless dynamodb install
   ```
4. Start the API locally with DynamoDB Local and serverless-offline:
   ```bash
   serverless offline start
   ```
   The FastAPI endpoints will be available at `http://localhost:3000`.

### Frontend
This repository contains only React component files under `frontend/src`. Create a React application (for example with `create-react-app` or `vite`) and copy the contents of `frontend/src` into your project. After installing the usual Node dependencies (`npm install`), run the dev server:
```bash
npm start
```
The frontend should be configured to send requests to `/submit-code` (served by the backend).

### Running Code Submissions
The backend relies on Docker to execute user code safely. Ensure Docker is running on your machine. The `run_code.py` helper spins up a temporary container based on `python:3.11-slim` with CPU and memory limits.

## Deployment
The `infra/serverless.yml` file defines the AWS Lambda function, API Gateway route and DynamoDB tables. Deploy to AWS with:
```bash
serverless deploy
```

For Amplify hosting and API management, follow these commented steps:
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add api
amplify add hosting
amplify publish
```
