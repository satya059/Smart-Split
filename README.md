# SplitMint — Expense Splitting Application

A modern, full-stack expense splitting application built with React, Node.js, and Prisma. Features AI-powered natural language expense parsing with MintSense AI.

## Features

- **User Authentication** - Secure JWT-based login and registration
- **Group Management** - Create groups with up to 4 participants
- **Smart Expense Splitting** - Equal, custom amount, or percentage splits
- **Real-time Balances** - Automatic balance calculations
- **Settlement Suggestions** - Minimal transaction suggestions
- **MintSense AI** - Natural language expense parsing powered by Groq
- **Beautiful UI** - Dark theme with premium animations

## Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)
- JWT Authentication
- Groq AI Integration

### Frontend
- React 18 + Vite
- React Router v6
- Custom CSS Design System
- 1,200+ lines of premium styling

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs on: http://localhost:3001

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your-groq-api-key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `DELETE /api/groups/:id` - Delete group

### Expenses
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense

### AI (MintSense)
- `POST /api/ai/parse-expense` - Parse natural language expense
- `POST /api/ai/categorize` - Auto-categorize expense
- `GET /api/ai/group-summary/:id` - Get AI summary

## Screenshots

### Home Page
Modern landing page with feature showcase

### Dashboard
Group overview with summary statistics

### Group Page
Expense management with MintSense AI integration

## License

MIT
