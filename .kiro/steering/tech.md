# Technology Stack

## Core Technologies

- **Language**: JavaScript (ES6+)
- **Frontend Framework**: Vue 3 (Composition API)
- **Runtime**: Node.js 18+
- **Module System**: CommonJS for business logic (`module.exports` / `require`), ES6 modules for Vue
- **Build Tool**: Webpack 5
- **Transpiler**: Babel
- **Testing**: Jest with jsdom environment
- **Property Testing**: fast-check library

## Build System

### Webpack Configuration
- Entry point: `src/main.js`
- Output: `dist/bundle.[contenthash].js` with cache busting
- Dev server runs on port 3000 with hot module replacement
- Plugins: HtmlWebpackPlugin, CopyWebpackPlugin, VueLoaderPlugin
- Loaders: vue-loader for .vue files, babel-loader for JS, style-loader + css-loader for CSS

### Babel
- Preset: @babel/preset-env
- Transpiles modern JavaScript for browser compatibility

## Testing Framework

### Jest Configuration
- Test environment: jsdom (for DOM testing)
- Test patterns: `**/*.test.js` and `**/*.spec.js`
- Coverage threshold: 80% for branches, functions, lines, statements
- Excludes: `src/main.js`, `node_modules`
- CSS mocking: `tests/__mocks__/styleMock.js`

### Testing Strategy
- **Unit tests**: Specific examples and edge cases
- **Property-based tests**: Universal properties with 100+ iterations using fast-check
- **Integration tests**: UI and keyboard interaction testing

## Common Commands

```bash
# Development
npm install              # Install dependencies
npm start               # Start dev server with auto-open (port 3000)
npm run dev             # Start dev server without auto-open

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Building
npm run build           # Production build to dist/

# Docker
docker build -t hurdle .                    # Build image (includes tests)
docker run -p 80:80 hurdle                  # Run container
docker run -d -p 80:80 --name hurdle-app hurdle  # Run detached
```

## Deployment Stack

### Containerization
- **Docker**: Multi-stage build (build stage + nginx production stage)
- **Nginx**: Serves static files in production
- Build fails if tests fail (ensures quality)

### DigitalOcean Infrastructure
- **Container Registry**: Docker container registry
- **App Platform**: Serverless application hosting
- **Load Balancer**: Built-in traffic distribution
- **Spaces**: Object storage for assets
- **Terraform**: Infrastructure as Code

### CI/CD Pipeline
GitHub → DigitalOcean App Platform (automatic build + deploy)

Deployment is automated on every push to GitHub. Tests must pass before deployment.
