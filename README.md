# Is It A Bargain?

A mobile app for rating and discovering good deals on items. Built with Expo Router and deployed to AWS Lightsail.

## Architecture

- **Mobile App**: Expo (React Native) with file-based routing
- **API Routes**: Expo Router API routes (server-side)
- **Backend**: Node.js + Express + `expo-server`
- **Deployment**: AWS Lightsail Instance (shared with superhero-ttrpg)
- **CI/CD**: GitHub Actions → ECR → Lightsail
- **Domain**: https://bargain-api.callingallheroes.net

## Development

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## API Routes

API routes are defined in `app/api/` with `+api.ts` suffix:

- `GET /api/user` - Get current user info
- `GET /api/posts` - List user's posts
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get specific post
- `GET /api/posts-to-rate` - Get posts to rate
- `POST /api/ratings` - Submit rating

Currently using mock data in `mocks/data.ts`.

## Production Deployment

### API Server

The API is deployed to AWS Lightsail at `https://bargain-api.callingallheroes.net`.

**Automatic deployment via GitHub Actions:**
- Push to `main` branch triggers deployment
- Builds Docker image and pushes to ECR
- Deploys to Lightsail instance via SSH
- Zero-downtime deployment

**Manual deployment:**
```bash
# Build and push
docker build --platform linux/amd64 -t bargain-api .
docker tag bargain-api:latest 814155132173.dkr.ecr.us-east-1.amazonaws.com/bargain-api-ecr-repo:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 814155132173.dkr.ecr.us-east-1.amazonaws.com
docker push 814155132173.dkr.ecr.us-east-1.amazonaws.com/bargain-api-ecr-repo:latest

# Deploy on instance
ssh ubuntu@18.215.116.116
podman pull 814155132173.dkr.ecr.us-east-1.amazonaws.com/bargain-api-ecr-repo:latest
podman stop bargain-api && podman rm bargain-api
podman run -d --name bargain-api -p 3001:3001 --restart unless-stopped 814155132173.dkr.ecr.us-east-1.amazonaws.com/bargain-api-ecr-repo:latest
```

### Mobile App

Build release version:
```bash
# iOS
npx expo run:ios --configuration Release --device "lhphone"

# Android
npx expo run:android --variant release
```

The app connects to the production API at `https://bargain-api.callingallheroes.net` (configured in `app.json`).

## Project Structure

```
app/
├── (tabs)/          # Tab navigation screens
├── api/             # API routes (server-side)
├── create/          # Post creation flow
├── post/            # Post detail screens
└── +middleware.ts   # Request logging middleware

lib/
└── api.ts           # API client functions

mocks/
└── data.ts          # Mock data (users, posts, ratings)
```

## Infrastructure

Infrastructure is managed in the `personal-website-cdk` repository:

- **ECR Repository**: `bargain-api-ecr-repo` (in DndApplicationStack)
- **IAM Role**: GitHub Actions OIDC role (in BargainApiCicdStack)
- **DNS**: Route53 A record for `bargain-api.callingallheroes.net`
- **HTTPS**: Caddy reverse proxy with automatic Let's Encrypt

## Environment Variables

The API origin is configured in `app.json`:

```json
{
  "plugins": [
    ["expo-router", {
      "origin": "https://bargain-api.callingallheroes.net",
      "unstable_useServerMiddleware": true
    }]
  ]
}
```
