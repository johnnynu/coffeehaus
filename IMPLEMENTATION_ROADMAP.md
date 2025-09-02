# Coffeehaus - Final Features Implementation Roadmap

## 🎯 Overview
This document outlines the remaining features needed to complete the Coffeehaus coffee shop discovery platform, transforming it into a social coffee community with robust search capabilities.

## 🔍 1. Search Radius Expansion & Discovery

### Current Limitations
- **Default radius**: 50km (finds 41 shops in LA)
- **Discovery triggers**: Only once upfront, ignores pagination
- **Issue**: Users hit "no more coffee shops" during infinite scroll

### Implementation Plan
```typescript
// Progressive fallback strategy
1. Search DB within 50km
2. If exhausted → Expand to 100km (+10 more shops)
3. If still low → Expand to 200km (+2 more shops)
4. If total_count < 50 → Trigger discovery API
5. Show "Expanding search area..." UI feedback
```

### Required Changes
- ✅ Fix discovery logic to consider `offset` values during pagination
- ✅ Implement progressive radius expansion (50km → 100km → 200km)
- ✅ Add remaining results calculation: `remainingResults = totalCount - offset`
- ✅ Enhance UX with search area expansion indicators

---

## 🖼️ 2. Image System Overhaul

### Current Problem
- Images load directly from `googleusercontent.com`
- Google rate limits cause broken images
- No user-generated content

### Hybrid Solution: Supabase + Cloudinary

#### Google Images (Rate Limit Protection)
```typescript
// Before: https://lh3.googleusercontent.com/...
// After: https://res.cloudinary.com/your-cloud/image/fetch/https://lh3.googleusercontent.com/...
```

#### User Uploads (Supabase Storage)
```sql
CREATE TABLE coffee_shop_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coffee_shop_id UUID REFERENCES coffee_shops(id),
  url TEXT NOT NULL,
  source TEXT CHECK (source IN ('google', 'user_upload')),
  uploaded_by UUID REFERENCES auth.users(id),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Implementation Tasks
- ✅ Update `imageUtils.ts` with Cloudinary fetch wrapper
- ✅ Build drag & drop upload component
- ✅ Create mixed image galleries (Google + user photos)
- ✅ Add authentication-gated upload functionality
- ✅ Implement file validation and moderation

---

## ⭐ 3. Reviews & Social Feed System

### Database Schema
```sql
-- Reviews with ratings
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coffee_shop_id UUID REFERENCES coffee_shops(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coffee_shop_id, user_id) -- One review per user per shop
);

-- Review images
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id),
  url TEXT NOT NULL, -- Supabase Storage URL
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social activity feed
CREATE TABLE feed_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  coffee_shop_id UUID REFERENCES coffee_shops(id),
  activity_type TEXT CHECK (activity_type IN ('review', 'photo_upload')),
  review_id UUID REFERENCES reviews(id),
  image_id UUID REFERENCES coffee_shop_images(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints
```typescript
// Reviews
POST   /api/coffee-shops/:id/reviews    // Create review with images
GET    /api/coffee-shops/:id/reviews    // Get shop reviews
PUT    /api/reviews/:id                 // Update own review
DELETE /api/reviews/:id                 // Delete own review

// Social feed
GET    /api/feed                        // TikTok-style activity feed
GET    /api/users/:id/reviews           // User's review history

// Images
POST   /api/coffee-shops/:id/images     // Upload photos
DELETE /api/coffee-shops/:id/images/:imageId // Delete own uploads
```

### Frontend Components
```typescript
// Review System
- ReviewForm.tsx          // Write reviews + attach images
- ReviewList.tsx          // Display reviews on detail pages
- ReviewCard.tsx          // Individual review with photos

// Social Feed (TikTok-style)
- FeedCard.tsx           // Review/photo activity posts
- InfiniteActivityFeed.tsx // Infinite scroll feed
- Enhanced HomePage.tsx   // Feed replaces static content
```

### Feed Content Examples
- "John posted a review of Blue Bottle Coffee" ⭐⭐⭐⭐⭐
- "Sarah uploaded 3 photos to Stumptown Coffee" 📸
- Mix of reviews + standalone photo uploads with infinite scroll

---

## 🚀 Implementation Priority

### Phase 1: Search Enhancement
1. Fix discovery pagination logic
2. Implement progressive radius expansion
3. Add search area UI indicators

### Phase 2: Image System
1. Cloudinary integration for Google images
2. Supabase storage for user uploads
3. Mixed image galleries

### Phase 3: Social Features
1. Reviews system with star ratings
2. Social activity feed
3. User-generated content integration

---
---