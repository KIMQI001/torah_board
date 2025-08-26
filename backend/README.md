# DePIN Dashboard Backend API

A robust backend API for the DePIN (Decentralized Physical Infrastructure Networks) Dashboard, providing comprehensive user management, project tracking, and node monitoring capabilities.

## 🚀 Features

- **Wallet-based Authentication**: Secure authentication using Solana wallet signatures
- **DePIN Project Management**: Full CRUD operations for DePIN projects
- **Node Management**: Track and monitor user nodes across different networks
- **Real-time Performance Monitoring**: WebSocket-based real-time updates
- **ROI Calculations**: Advanced ROI calculations with location-based factors
- **RESTful API**: Clean, well-documented REST API endpoints
- **Type Safety**: Full TypeScript implementation with strict typing
- **Database Integration**: PostgreSQL with Prisma ORM
- **Caching**: Redis for improved performance
- **Security**: JWT authentication, rate limiting, input validation

## 🛠 Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Blockchain**: Solana Web3.js
- **Authentication**: JWT + Wallet Signatures
- **Validation**: Joi
- **Documentation**: Auto-generated API docs
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 15+
- Redis 7+
- npm or yarn

## 🔧 Installation

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Docker Development

1. **Start with Docker Compose**
```bash
docker-compose up -d
```

2. **Run database migrations**
```bash
docker-compose exec backend npm run db:migrate
```

## 🔐 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` | No |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` | No |
| `COINGECKO_API_KEY` | CoinGecko API key | - | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/message` | Generate authentication message |
| `POST` | `/api/v1/auth/authenticate` | Authenticate with wallet signature |
| `GET` | `/api/v1/auth/verify` | Verify current token |
| `POST` | `/api/v1/auth/refresh` | Refresh JWT token |
| `PUT` | `/api/v1/auth/settings` | Update user settings |

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/projects` | Get all projects |
| `GET` | `/api/v1/projects/:id` | Get project by ID |
| `GET` | `/api/v1/projects/category/:category` | Get projects by category |
| `POST` | `/api/v1/projects` | Create new project |
| `PUT` | `/api/v1/projects/:id` | Update project |
| `DELETE` | `/api/v1/projects/:id` | Delete project |

### Authentication Flow

1. **Generate Message**: Client requests an authentication message
```bash
curl -X POST http://localhost:5000/api/v1/auth/message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "your_wallet_address"}'
```

2. **Sign Message**: Client signs the message with their wallet

3. **Authenticate**: Client sends signature for verification
```bash
curl -X POST http://localhost:5000/api/v1/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "your_wallet_address",
    "publicKey": "your_public_key",
    "signature": "signature_string",
    "message": "message_from_step_1"
  }'
```

4. **Use Token**: Include JWT token in subsequent requests
```bash
curl -X GET http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer your_jwt_token"
```

## 🗄 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Wallet-based user accounts
- **DePINProjects**: DePIN network projects
- **UserNodes**: User-owned nodes
- **NodePerformance**: Real-time performance metrics
- **ROICalculations**: ROI calculation history
- **SystemNotifications**: System notifications

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 🚢 Deployment

### Production Docker Deployment

1. **Build and deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Run migrations**
```bash
docker-compose exec backend npm run db:migrate
```

### Manual Deployment

1. **Build the application**
```bash
npm run build
```

2. **Start the production server**
```bash
npm start
```

## 📊 Monitoring

The API includes several monitoring endpoints:

- **Health Check**: `GET /health`
- **Metrics**: Built-in performance metrics
- **Logging**: Structured logging with different levels

## 🔒 Security

- **Rate Limiting**: Configurable request rate limiting
- **Helmet**: Security headers middleware
- **Input Validation**: Joi-based request validation
- **JWT Authentication**: Secure token-based authentication
- **Wallet Signature Verification**: Cryptographic signature verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for debugging information