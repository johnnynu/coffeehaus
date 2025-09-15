# ☕ Coffeehaus

A modern coffee shop discovery platform that helps you find the perfect coffee experience near you. Built with React, TypeScript, and powered by intelligent location-based search with AI-driven recommendations.

## 🌟 Features

### 🔍 **Intelligent Coffee Discovery**
- **Location-aware search** with progressive radius expansion (50km → 100km → 200km)
- **AI-powered intent detection** using Claude API for specific coffee shop searches
- **PostGIS-powered geospatial queries** for accurate distance calculations
- **Infinite scroll** with smart pagination and discovery triggers

### 🎯 **Yelp-like Experience**
- **Interactive map integration** with real-time location services
- **Detailed coffee shop profiles** with ratings, hours, and contact information
- **Image galleries** with rate-limited Google Photos integration
- **Business information** including phone, website, and operating hours

### 🔐 **Modern Authentication**
- **Clerk integration** for secure user authentication
- **Protected routes** and user session management
- **Social login support** and user profile management

### 🎨 **Beautiful UI/UX**
- **Dark/Light theme** support with system preference detection
- **Responsive design** optimized for mobile and desktop
- **TailwindCSS** styling with custom animations
- **Loading states** and skeleton components for smooth UX

## 🏗️ Architecture

### **Frontend** (`/frontend`)
- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for client-side routing
- **TailwindCSS** for styling
- **Clerk** for authentication
- **Supabase** for real-time data sync

### **Backend** (`/backend`)
- **Hono** lightweight web framework
- **Node.js** with TypeScript
- **Supabase** PostgreSQL database with PostGIS
- **Anthropic Claude AI** for search intent detection
- **Axios** for external API integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/johnnynu/coffeehaus.git
cd coffeehaus
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. **Environment Setup**

Create `.env` files in both frontend and backend directories:

**Frontend `.env`:**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend `.env`:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. **Database Setup**
Set up your Supabase database with PostGIS extension enabled for geospatial queries.

5. **Start Development Servers**
```bash
# Start backend (from /backend directory)
npm run dev

# Start frontend (from /frontend directory)  
npm run dev
```

The application will be available at `http://localhost:5173` with the API at `http://localhost:3002`.

## 📝 Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

## 🗺️ Project Structure

```
coffeehaus/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and helpers
│   │   └── services/       # API and external service integrations
│   └── package.json
├── backend/                 # Hono backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   └── package.json
├── IMPLEMENTATION_ROADMAP.md # Development roadmap
└── README.md
```

## 🔮 Upcoming Features

### **Phase 1: Enhanced Search**
- ✅ Progressive radius expansion for better discovery
- ✅ AI-powered specific coffee shop search
- ✅ Distance display with location calculations

### **Phase 2: Image System Overhaul**
- [ ] Cloudinary integration for rate-limit protection
- [ ] User photo uploads via Supabase Storage
- [ ] Mixed image galleries (Google + user content)

### **Phase 3: Social Features**
- [ ] User reviews and star ratings
- [ ] Social activity feed (TikTok-style)
- [ ] User-generated content and community features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Made with ☕ and ❤️ by the Coffeehaus team**