# Unnect Events - Event Discovery & Management Platform

## Overview

Unnect Events is a modern web application for discovering and managing local events. Built with React, TypeScript, and Node.js, it provides a mobile-first experience for users to browse, create, and manage events in their city. The application features user authentication via Replit Auth, real-time event updates, and a clean, responsive interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with TypeScript validation

### Mobile-First Design
- Responsive layout optimized for mobile devices
- Touch-friendly navigation with bottom navigation bar
- Progressive Web App capabilities
- Glass morphism design patterns

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Storage**: PostgreSQL-backed sessions
- **User Management**: Automatic user creation and profile management
- **Security**: HTTP-only cookies with secure session handling

### Event Management
- **Event Discovery**: Category-based filtering and search
- **Event Creation**: Rich form with validation
- **RSVP System**: User event attendance tracking
- **Event Saving**: Personal event bookmarking
- **Image Support**: Event image uploads and display

### Database Schema
- **Users**: Profile information and authentication data
- **Events**: Event details, metadata, and relationships
- **RSVPs**: User attendance tracking
- **Saved Events**: User bookmarks
- **Sessions**: Authentication session storage

### UI Components
- **Responsive Design**: Mobile-first approach with desktop adaptation
- **Component Library**: shadcn/ui for consistent design system
- **Form Handling**: React Hook Form with Zod validation
- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton components and loading indicators

## Data Flow

### Event Discovery Flow
1. User accesses home page
2. Category filter loads available categories
3. Events are fetched based on selected category
4. Real-time updates via TanStack Query
5. User can search, filter, and interact with events

### Event Creation Flow
1. Authenticated user accesses create event form
2. Form validation using Zod schemas
3. Event data submitted to backend API
4. Database insertion with relationship creation
5. User redirected to event details

### Authentication Flow
1. User initiates login via Replit Auth
2. OpenID Connect authentication
3. User profile created or updated
4. Session established with PostgreSQL storage
5. Frontend receives user context

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle with PostgreSQL adapter
- **Authentication**: Replit Auth OpenID Connect
- **UI Library**: Radix UI primitives
- **Date Handling**: date-fns for date manipulation
- **Form Validation**: Zod for schema validation

### Development Dependencies
- **Build System**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **CSS Processing**: Tailwind CSS with PostCSS
- **Database Migration**: Drizzle Kit for schema management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR
- **Database**: Neon PostgreSQL connection
- **Authentication**: Replit Auth development mode
- **Error Handling**: Runtime error overlay for debugging

### Production Build
- **Frontend**: Vite build with optimizations
- **Backend**: ESBuild bundle for Node.js
- **Static Assets**: Served from dist/public directory
- **Database**: Production PostgreSQL connection

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session key
- **Replit Integration**: Domain and authentication configuration
- **Development Tools**: Replit-specific development enhancements

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Migration from Replit Agent to Replit environment completed
  - Database migration and schema setup
  - Dark mode styling fixes
  - Admin user creation (admin@unnect.com)
  - All core functionality verified and working
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```