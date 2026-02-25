# OpenFeedback

A Self-hosted, open-source feedback and feature request management platform.

## Features

- **100% Canny API Compatible** - Existing Canny clients work by changing `BASE_URL`
- **Shadow Users** - Anonymous feedback without forced sign-up via `useShadowUser` hook
- **Embeddable Components** - React components you can embed anywhere
- **Full-Stack Solution** - API + Web dashboard included
- **Google SSO** - Plug-and-play authentication with JWT
- **Self-Hosted** - Your data stays on your servers

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/openfeedback.git
cd openfeedback

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d
```

The API will be available at `http://localhost:3000` and the web dashboard at `http://localhost:5173`.

### Development Setup

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Start MongoDB (requires Docker)
docker run -d --name mongo -p 27017:27017 mongo:7

# Start the API
pnpm --filter @openfeedback/api dev

# Start the web app (in another terminal)
pnpm --filter @openfeedback/web dev
```

## Project Structure

```
openfeedback/
├── apps/
│   ├── api/          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/        # Database, passport config
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── middlewares/   # Auth, validation, error handling
│   │   │   ├── models/        # Mongoose schemas
│   │   │   ├── routes/        # API routes
│   │   │   └── services/      # Business logic
│   │   └── Dockerfile
│   │
│   └── web/          # React frontend
│       ├── src/
│       │   ├── components/    # FeedbackBoard, Roadmap, etc.
│       │   ├── hooks/         # useShadowUser, useOpenFeedback
│       │   ├── services/      # API client
│       │   └── stores/        # Zustand state management
│       └── Dockerfile
│
├── packages/
│   └── shared/       # Shared TypeScript types
│
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## API Endpoints

All endpoints follow Canny.io API conventions and accept `POST` requests with `apiKey` in the body.

### Boards
- `POST /api/v1/boards/list` - List all boards
- `POST /api/v1/boards/retrieve` - Get board by ID

### Posts (Feedback)
- `POST /api/v1/posts/list` - List posts with filtering/pagination
- `POST /api/v1/posts/retrieve` - Get post by ID
- `POST /api/v1/posts/create` - Create a new post
- `POST /api/v1/posts/update` - Update a post

### Votes
- `POST /api/v1/votes/create` - Upvote a post
- `POST /api/v1/votes/delete` - Remove a vote
- `POST /api/v1/votes/list` - List votes

### Comments
- `POST /api/v1/comments/list` - List comments on a post
- `POST /api/v1/comments/create` - Add a comment

### Users
- `POST /api/v1/users/create_or_update` - Create/update user (for shadow users)
- `POST /api/v1/users/retrieve` - Get user by ID/email

### Categories & Tags
- `POST /api/v1/categories/list` - List categories
- `POST /api/v1/tags/list` - List tags

### Changelog
- `POST /api/v1/entries/list` - List changelog entries
- `POST /api/v1/entries/create` - Create changelog entry

### Authentication
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback

## Embedding Components

Install the package:

```bash
npm install @openfeedback/web
```

Use in your React app:

```tsx
import { 
  OpenFeedbackProvider, 
  FeedbackBoard, 
  Roadmap,
  useShadowUser 
} from '@openfeedback/web';
import '@openfeedback/web/style.css';

function App() {
  return (
    <OpenFeedbackProvider 
      apiUrl="https://your-api.com/api/v1" 
      apiKey="of_your_api_key"
    >
      {/* Full feedback board with voting */}
      <FeedbackBoard 
        boardId="abc123"
        onPostClick={(post) => console.log(post)}
      />
      
      {/* Kanban-style roadmap */}
      <Roadmap 
        boardId="abc123"
        columns={['planned', 'in progress', 'complete']}
      />
    </OpenFeedbackProvider>
  );
}
```

### Available Components

| Component | Description |
|-----------|-------------|
| `<FeedbackBoard />` | Full-featured feedback list with search, filter, sort |
| `<Roadmap />` | Kanban-style roadmap view |
| `<PostCard />` | Single feedback post card |
| `<VoteButton />` | Upvote button with count |
| `<CommentThread />` | Comment list with input |
| `<NewPostForm />` | Form for creating feedback |
| `<StatusBadge />` | Post status indicator |

### Shadow Users (Anonymous Feedback)

The `useShadowUser` hook enables anonymous feedback:

```tsx
import { useShadowUser } from '@openfeedback/web';

function MyComponent() {
  const { userId, isGuest, ensureUser } = useShadowUser();
  
  const handleVote = async () => {
    const id = await ensureUser(); // Creates guest if needed
    await vote({ postID: 'abc', voterID: id });
  };
  
  return (
    <button onClick={handleVote}>
      {isGuest ? 'Vote as Guest' : 'Vote'}
    </button>
  );
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/openfeedback` |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Optional |
| `PORT` | API server port | `3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Migration from Canny.io

1. Export your Canny data
2. Set up OpenFeedback
3. Point your existing Canny SDK to your OpenFeedback URL:

```js
// Before
Canny('init', { apiKey: 'xxx', basePath: 'https://canny.io/api/v1' });

// After
Canny('init', { apiKey: 'your-of-key', basePath: 'https://your-openfeedback.com/api/v1' });
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Mongoose
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **Database**: MongoDB
- **Auth**: Passport.js (JWT + Google OAuth)
- **Validation**: Zod
- **Package Manager**: pnpm (monorepo)

## License

MIT © 2024 OpenFeedback Contributors
