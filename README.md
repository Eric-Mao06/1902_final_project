# Linkd - Alumni Connection Platform

## Overview
Linkd is a web application to help undergraduate students connect with industry alumni. The application utilizes natural language processing to enable intuitive searches through an alumni database, allowing students to find alumni based on role, company, location, and shared interests. 

## 🌟 Key Features
- 🔐 Google OAuth Authentication
- 🔍 AI-Powered Semantic Search
- 👥 LinkedIn Profile Integration
- 💾 Vector Database Storage (MongoDB Atlas)

## 🛠️ Tech Stack
- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI, Aceternity UI
- **Backend**: FastAPI, Python
- **Authentication**: Google OAuth
- **Database**: MongoDB Atlas
- **AI/ML**: VoyageAI API (Embeddings), Gemini API (Text Generation)
- **API Integration**: LinkedIn Profile Scraping
- **Deployment**: Vercel, Railway: https://protective-quietude-production.up.railway.app/

## 📋 Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas Account
- VoyageAI API Key
- Google Cloud Project with OAuth 2.0 configured

## 🔧 Environment Variables
Create a `.env.local` file in the frontend directory:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_API_URL=your_next_public_api_url
```

Create a `.env.local` file in the backend directory:

```bash
SCRAPIN_API_KEY=your_scrapin_api_key
VOYAGE_API_KEY=your_voyage_api_key
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
```

## MongoDB Atlas Setup
1. Create a MongoDB Atlas account and cluster
2. Enable Vector Search on your cluster
3. Create a database named 'linkd'
4. Create collections named 'users' and 'alumni'
5. Create a vector search index named 'default' on the 'embedding' field in the alumni collection

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/Eric-Mao06/1902_final_project.git
cd 1902_final_project
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
cd frontend
npm run dev
```

## 📁 Project Structure

```
1902_final_project/
├── frontend/             # React components
│   ├── app/              # Pages, authentication
│   ├── components/       # Main layout components
│   └── ...
├── backend/             # Utility functions and configurations
│   ├── models/          # API clients setup
│   ├── routes/          # Routes
│   ├── src/             # API endpoints, scripts
│   └── ...
├── linkd/               # Mobile app with Expo
│   └── ...
└── ...
```

## 🔑 Core Features

### Authentication
- Google OAuth integration
- Protected routes and session management
- Secure token handling

### Profile Creation
1. LinkedIn URL submission
2. Profile data extraction
3. Embedding generation
4. Vector database storage

### Search Functionality
- Semantic search using VoyageAI embeddings
- Vector similarity matching 
- Relevance explanations for search results


