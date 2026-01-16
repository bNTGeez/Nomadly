# Nomadly 🌍

An AI agent-powered travel planning application that helps users create personalized trip itineraries. Nomadly uses an intelligent AI agent to generate custom travel plans based on user preferences, budget, interests, and travel style.

## Features

- 🤖 **AI Agent Itinerary Generation**: Generate personalized day-by-day itineraries using an intelligent AI agent
- 🗺️ **Smart POI Recommendations**: Automatically fetch and recommend points of interest from Foursquare
- 🔍 **Location Autocomplete**: Fast city search with Geoapify integration
- 📅 **Multi-Day Trip Planning**: Plan trips with custom start/end dates and daily schedules
- ⚙️ **User Preferences**: Customize trips with budget, interests, travel style, and pace settings
- 📋 **Trip Management**: Create, view, and manage multiple trips
- 🛡️ **Rate Limiting**: Built-in protection against API abuse; protects external APIs and prevents abuse in multi-user scenarios
- 🔐 **Secure Authentication**: Credentials-based auth via NextAuth.js with password hashing

Unlike generic travel apps, Nomadly uses an AI agent to intelligently curate and schedule activities, optimizing for user preferences and minimizing travel time between locations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **AI Agent**: OpenAI (via AI SDK) – tool-augmented itinerary planning agent
- **Styling**: Tailwind CSS
- **Rate Limiting**: Upstash Redis
- **APIs**:
  - Foursquare (POI data)
  - Geoapify (Location autocomplete)
- **Deployment**: Vercel-ready

## Project Structure

```
nomadly/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── trips/        # Trip management endpoints
│   │   ├── pois/         # Points of interest endpoints
│   │   └── geocoding/     # Location autocomplete
│   ├── components/       # React components
│   ├── generate/         # Trip generation page
│   ├── trips/            # Trip listing page
│   ├── trip/             # Individual trip view
│   └── layout.tsx        # Root layout
├── lib/
│   ├── ai-agent.ts       # AI agent for itinerary generation
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── rate-limit.ts     # Rate limiting setup
│   ├── validations.ts    # Zod schemas
│   └── ...               # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── types/                # TypeScript type definitions
```

## Key Features Explained

### AI Agent Itinerary Planning

The AI agent intelligently:

1. **POI Selection**: Analyzes available points of interest and selects the best matches based on user preferences, budget, and interests
2. **Schedule Optimization**: Creates time-optimized daily schedules that minimize travel time between locations
3. **Multi-Day Planning**: Generates cohesive itineraries across multiple days, avoiding duplicate activities
4. **Context Awareness**: Considers travel style (relaxed, explorer, adventurer), budget constraints, and meal preferences

The agent operates in a tool-augmented flow, combining database queries, POI filtering, and structured itinerary generation before producing a final plan.

### Location-Aware vs Activity-Focused Modes

- **Location-Aware Mode**: Optimizes for geographic proximity, minimizing travel time between activities
- **Activity-Focused Mode**: Prioritizes the best experiences regardless of location

### Smart POI Seeding

- Automatically fetches POIs from Foursquare when a new city is selected
- Caches POI data to reduce API calls
- Supports filtering by district/area focus

## API Routes

### Authentication

Supports credentials-based authentication via NextAuth.js.

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/[...nextAuth]` - NextAuth endpoints

### Trips

- `GET /api/trips` - Get all trips for authenticated user
- `POST /api/trips` - Create a new trip
- `GET /api/trips/[tripId]` - Get trip details
- `DELETE /api/trips/[tripId]` - Delete a trip
- `POST /api/trips/[tripId]/generate` - Generate itinerary for a trip
- `GET /api/trips/[tripId]/itinerary` - Get trip itinerary

### POIs

- `GET /api/pois` - Search POIs
- `GET /api/pois/[poiId]` - Get POI details

### Geocoding

- `GET /api/geocoding/autocomplete` - Location autocomplete

## Database Schema

- **User**: User accounts with email, username, and hashed passwords
- **Trip**: Trip plans with dates, preferences, and settings
- **TripDay**: Individual days within a trip
- **AgendaItem**: Scheduled activities/POIs for each day
- **Poi**: Points of interest with location data, tags, and metadata
- **FixedWindow**: Fixed time commitments (flights, reservations) for scheduling
- **CalendarSync**: Google Calendar integration (schema ready, implementation extensible)

## Security Features

- Password hashing with bcryptjs
- Rate limiting on all API endpoints (Upstash Redis)
- Input validation with Zod schemas
- Authentication middleware protecting routes
- User authorization (users can only access their own trips)

## Deployment

- Frontend & API deployed on Vercel (Next.js App Router)
- PostgreSQL hosted on managed cloud database
- Authentication handled via NextAuth.js
- Rate limiting via Upstash Redis
- Environment-based configuration for dev/prod parity

Check it out:

https://nomadly-eosfon1t5-benjamin-tangs-projects.vercel.app/
