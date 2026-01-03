# Hurdle 🎯

A challenging word-guessing game with 5000+ valid English words, making it significantly more challenging than traditional Wordle.

## 🚀 Quick Start

### Local Development with Docker

1. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd hurdle
   npm install
   ```

2. **Start with Docker Compose**:
   ```bash
   npm run docker:dev
   ```

   This will start:
   - MySQL database on port 3306
   - Hurdle app on port 3000
   - phpMyAdmin on port 8080 (optional database management)

3. **Access the application**:
   - **Game**: http://localhost:3000
   - **Database Admin**: http://localhost:8080 (root/rootpassword)

### Manual Local Development

1. **Start MySQL only**:
   ```bash
   npm run db:setup
   ```

2. **Install dependencies and start app**:
   ```bash
   npm install
   npm run dev
   ```

## 🗄️ Database

### Default: Browser localStorage (FREE)
The app uses browser localStorage by default - no external database required! Game statistics are stored locally in your browser.

### Optional: External Database
For cross-device sync and persistent storage, you can use free database services:
- **Supabase**: 500MB free PostgreSQL
- **Railway**: $5 monthly credit
- **Neon**: 1GB free PostgreSQL

See [FREE-DATABASE-SETUP.md](FREE-DATABASE-SETUP.md) for detailed setup instructions.

### Local Development with MySQL (Docker)
For local development with MySQL:
```bash
npm run docker:dev  # Includes MySQL + phpMyAdmin
```

## 🐳 Docker Commands

```bash
# Development
npm run docker:dev          # Start all services
npm run docker:dev:detached # Start in background
npm run docker:stop         # Stop all services
npm run docker:clean        # Stop and remove volumes

# Database only
npm run db:setup            # Start MySQL only
npm run db:reset            # Reset database (removes all data)
```

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:e2e           # End-to-end tests
```

## 🏗️ Building

```bash
npm run build              # Production build
docker build -t hurdle .   # Docker image
```

## 🌐 Deployment

### DigitalOcean with Terraform

**Ultra-Low-Cost Deployment ($5/month):**

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This creates:
- DigitalOcean App Platform ($5/month)
- Container Registry (FREE)
- Uses browser localStorage for game data (FREE)

**Optional: Add External Database**
See [FREE-DATABASE-SETUP.md](FREE-DATABASE-SETUP.md) for free database options like Supabase.

### Environment Variables

**Local Development** (`.env.local`):
```env
# Optional: Add database connection for external services
# DB_HOST=your-database-host
# DB_PORT=5432
# DB_NAME=your-database-name
# DB_USER=your-username
# DB_PASSWORD=your-password
NODE_ENV=development
```

**Production** (DigitalOcean App Platform):
- Uses browser localStorage by default (no database env vars needed)
- Optionally add database environment variables for external services

## 📊 Features

- **5000+ Words**: Uses comprehensive English dictionary
- **Statistics Tracking**: Win rates, streaks, guess distribution (localStorage)
- **Optional Database**: Support for external free databases (Supabase, Railway, Neon)
- **Responsive Design**: Works on desktop and mobile
- **Docker Support**: Easy local development
- **Auto-deployment**: CI/CD with DigitalOcean App Platform
- **Cost-Optimized**: $5/month deployment with free data storage

## 🎮 Game Rules

- 6 attempts to guess a 5-letter word
- **Green**: Correct letter in correct position
- **Yellow**: Correct letter in wrong position
- **Gray**: Letter not in the word
- Only valid English words accepted

## 🛠️ Tech Stack

- **Frontend**: Vue 3, Webpack 5, Babel
- **Backend**: Node.js 18+
- **Database**: MySQL 8.0
- **Testing**: Jest, Selenium WebDriver
- **Infrastructure**: Terraform, DigitalOcean App Platform
- **Containerization**: Docker, Docker Compose

## 📁 Project Structure

```
hurdle/
├── src/                    # Application source code
├── tests/                  # Test files
├── public/                 # Static assets
├── terraform/              # Infrastructure as Code
├── database/               # Database initialization
├── docker-compose.yml      # Local development setup
└── [config files]         # Build and deployment config
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details