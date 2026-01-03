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

### Local MySQL (Docker)
- **Host**: localhost
- **Port**: 3306
- **Database**: hurdle
- **User**: hurdle_user
- **Password**: hurdle_password

### Production (DigitalOcean)
Database connection is automatically configured via environment variables set by Terraform.

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

1. **Configure Terraform**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

### Environment Variables

**Local Development** (`.env.local`):
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hurdle
DB_USER=hurdle_user
DB_PASSWORD=hurdle_password
NODE_ENV=development
```

**Production** (set by Terraform):
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## 📊 Features

- **5000+ Words**: Uses comprehensive English dictionary
- **Statistics Tracking**: Win rates, streaks, guess distribution
- **MySQL Database**: Persistent game data and statistics
- **Responsive Design**: Works on desktop and mobile
- **Docker Support**: Easy local development
- **Auto-deployment**: CI/CD with DigitalOcean App Platform

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