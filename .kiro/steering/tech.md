# Technology Stack

## Frontend
- **Vue 3**: Main UI framework with Composition API
- **Webpack 5**: Module bundler and build system
- **Babel**: JavaScript transpilation
- **CSS**: Vanilla CSS for styling (no preprocessors)

## Backend & Database
- **Node.js 18+**: Runtime environment
- **MySQL 8.0**: Database for game statistics and user data
- **mysql2**: Database driver

## Testing
- **Jest**: Unit and integration testing framework
- **@vue/test-utils**: Vue component testing utilities
- **Selenium WebDriver**: End-to-end testing
- **jsdom**: DOM testing environment

## Infrastructure
- **Docker & Docker Compose**: Local development environment
- **Terraform**: Infrastructure as Code for DigitalOcean deployment
- **DigitalOcean App Platform**: Production hosting
- **nginx**: Web server (production)

## Common Commands

### Development
```bash
npm run dev              # Start development server (port 3000)
npm run docker:dev       # Start with Docker Compose (recommended)
npm run docker:stop      # Stop Docker services
npm run docker:clean     # Clean Docker volumes
```

### Database
```bash
npm run db:setup         # Start MySQL only
npm run db:reset         # Reset database (removes all data)
```

### Testing
```bash
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run Selenium end-to-end tests
```

### Building
```bash
npm run build            # Production build
docker build -t hurdle . # Build Docker image
```

## Environment Variables

### Local Development (.env.local)
- `DB_HOST=localhost`
- `DB_PORT=3306` 
- `DB_NAME=hurdle`
- `DB_USER=hurdle_user`
- `DB_PASSWORD=hurdle_password`
- `NODE_ENV=development`

### Production (set by Terraform)
- `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`