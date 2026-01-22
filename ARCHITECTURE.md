# Project Architecture

This document describes the modular and reusable architecture of the project.

## Directory Structure

```
web/
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts           # Authentication hook
│   ├── usePlaces.ts         # Places data fetching hook
│   ├── useProducts.ts       # Products data fetching hook
│   ├── useMessages.ts       # Messages management hook
│   └── index.ts             # Hooks exports
│
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.tsx       # Standardized button component
│   │   ├── Input.tsx        # Standardized input component
│   │   ├── Card.tsx         # Card container component
│   │   ├── Modal.tsx        # Modal dialog component
│   │   ├── LoadingSpinner.tsx # Loading indicator
│   │   └── index.ts         # Common components exports
│   │
│   └── [other components]   # Feature-specific components
│
├── lib/
│   ├── api/
│   │   ├── shared/          # Shared API utilities
│   │   │   ├── cors.ts      # CORS headers and helpers
│   │   │   ├── errors.ts    # Error handling utilities
│   │   │   ├── auth.ts      # Authentication helpers
│   │   │   └── index.ts     # Shared utilities exports
│   │   │
│   │   ├── places.ts        # Places API functions
│   │   ├── products.ts      # Products API functions
│   │   └── visits.ts        # Visits API functions
│   │
│   ├── types.ts             # Database types and interfaces
│   └── supabase.ts          # Supabase client
│
├── types/
│   ├── components.ts        # Component-specific types
│   └── index.ts             # Centralized type exports
│
└── utils/
    ├── helpers.ts           # General utility functions
    └── index.ts             # Utils exports

supabase/
└── functions/
    └── _shared/             # Shared Edge Function utilities
        ├── cors.ts          # CORS for Edge Functions
        ├── errors.ts        # Error handling for Edge Functions
        ├── auth.ts          # Auth helpers for Edge Functions
        └── index.ts         # Shared utilities exports
```

## Key Principles

### 1. **Reusability First**
Before adding any new feature, always check if you can:
- Import an existing hook instead of writing data fetching logic
- Use a common component instead of creating a new one
- Reuse a utility function instead of duplicating code

### 2. **Custom Hooks for Data Fetching**
All Supabase data fetching logic should be in custom hooks:
- `useAuth()` - User authentication and profile
- `usePlaces()` - Fetch places (all, featured, or by user)
- `usePlace(id)` - Fetch single place
- `useProducts()` - Fetch products (by place or search)
- `useMessages()` - Fetch and manage messages

**Example:**
```tsx
// ❌ Don't do this in components
const [places, setPlaces] = useState([])
useEffect(() => {
  supabase.from('places').select('*').then(...)
}, [])

// ✅ Use hooks instead
const { places, loading, error, refresh } = usePlaces({ featured: true })
```

### 3. **Common UI Components**
Use standardized components from `components/common/`:
- `<Button>` - Consistent button styling
- `<Input>` - Form inputs with labels and error handling
- `<Card>` - Container with consistent padding and styling
- `<Modal>` - Modal dialogs
- `<LoadingSpinner>` - Loading indicators

**Example:**
```tsx
// ❌ Don't create custom buttons
<button className="bg-blue-500 text-white px-4 py-2">Click</button>

// ✅ Use common Button component
<Button variant="primary">Click</Button>
```

### 4. **Shared API Utilities**
For API routes (`app/api/`), use shared utilities:
- `corsHeaders`, `corsResponse()` - CORS handling
- `errorResponse()`, `successResponse()` - Standardized responses
- `requireAuth()`, `requireAdmin()` - Authentication checks

**Example:**
```tsx
import { requireAuth, successResponse, errorResponse } from '@/lib/api/shared'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    // ... your logic
    return successResponse(data)
  } catch (error) {
    return errorResponse(error.message, 500)
  }
}
```

### 5. **Centralized Types**
All TypeScript types are in:
- `lib/types.ts` - Database types (Place, Product, UserProfile, etc.)
- `types/components.ts` - Component prop types
- `types/index.ts` - Centralized exports

**Example:**
```tsx
import { Place, UserProfile, ButtonProps } from '@/types'
```

### 6. **Edge Functions Shared Utilities**
For Supabase Edge Functions, use `supabase/functions/_shared/`:
- Similar structure to API shared utilities
- Adapted for Deno runtime

## Migration Guide

### Migrating Components to Use Hooks

**Before:**
```tsx
const [places, setPlaces] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  supabase.from('places').select('*')
    .then(({ data }) => setPlaces(data))
    .finally(() => setLoading(false))
}, [])
```

**After:**
```tsx
const { places, loading, error, refresh } = usePlaces()
```

### Migrating to Common Components

**Before:**
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Submit
</button>
```

**After:**
```tsx
import { Button } from '@/components/common'

<Button variant="primary">Submit</Button>
```

## Best Practices

1. **Always check for existing utilities** before creating new ones
2. **Use TypeScript interfaces** from `types/` for component props
3. **Follow the naming conventions**: hooks start with `use`, components are PascalCase
4. **Keep components small and focused** - one responsibility per component
5. **Use shared utilities** for common operations (CORS, errors, auth)
6. **Document complex logic** with comments

## Adding New Features

When adding a new feature:

1. **Check hooks/** - Is there a hook for this data?
2. **Check components/common/** - Can you use an existing component?
3. **Check utils/** - Is there a utility function for this?
4. **Check types/** - Are the types defined?
5. **If not, create it** following the existing patterns

## Examples

### Example: Adding a new data fetching hook

```tsx
// hooks/usePosts.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Post } from '@/lib/types'

export function usePosts(placeId: string) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch logic
  }, [placeId])

  return { posts, loading, refresh }
}
```

### Example: Adding a new common component

```tsx
// components/common/Select.tsx
'use client'

interface SelectProps {
  options: { value: string; label: string }[]
  // ... other props
}

export default function Select({ options, ...props }: SelectProps) {
  // Component implementation
}
```

---

**Remember:** The goal is to write less code, reduce duplication, and maintain consistency across the application.
