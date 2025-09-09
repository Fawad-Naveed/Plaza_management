# Performance Optimization Guide for Darbaal Plaza

## 🚀 Quick Wins Implemented

### 1. Bundle Optimization
- ✅ **Bundle Analyzer**: Added `@next/bundle-analyzer` to identify large dependencies
- ✅ **Code Splitting**: Created dynamic imports for heavy components
- ✅ **Webpack Optimization**: Configured chunk splitting in `next.config.mjs`

### 2. Image & Font Optimization
- ✅ **Next.js Image**: Enabled optimized images with WebP/AVIF formats
- ✅ **Font Loading**: Optimized font loading with preload hints
- ✅ **Font Display**: Added font-display: swap for better performance

### 3. Database Performance
- ✅ **Caching Layer**: Created `OptimizedSupabaseClient` with in-memory caching
- ✅ **Query Optimization**: Added pagination, batching, and efficient queries
- ✅ **Connection Management**: Optimized real-time subscriptions

### 4. Performance Monitoring
- ✅ **Core Web Vitals**: Added hooks to track LCP, FID, CLS
- ✅ **Render Performance**: Component-level render time tracking
- ✅ **Query Performance**: Database query performance monitoring

## 📊 How to Use the Optimizations

### Bundle Analysis
```bash
# Analyze your bundle size
npm run analyze
```

### Using Dynamic Components
```tsx
import { BillGeneration, CustomerManagement } from '@/components/dynamic'

// Components will be lazy-loaded when needed
function MyComponent() {
  return (
    <div>
      <BillGeneration />
      <CustomerManagement />
    </div>
  )
}
```

### Using Optimized Database Client
```tsx
import { getOptimizedSupabaseClient } from '@/lib/supabase-optimized'

const client = getOptimizedSupabaseClient()

// Cached queries (5-minute cache by default)
const { data, fromCache } = await client.select('customers', {
  limit: 50,
  cacheTTL: 10 * 60 * 1000 // 10 minutes cache
})

// Efficient pagination
const { data, totalCount } = await client.selectPaginated('bills', {
  page: 1,
  pageSize: 20,
  order: { column: 'created_at', ascending: false }
})
```

### Performance Monitoring
```tsx
import { usePagePerformance, useRenderPerformance } from '@/hooks/use-performance'

function MyComponent() {
  const metrics = usePagePerformance()
  const { renderCount } = useRenderPerformance('MyComponent')
  
  console.log('Page metrics:', metrics)
  
  return <div>Component rendered {renderCount} times</div>
}
```

## 🎯 Performance Targets

### Core Web Vitals Goals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

### Custom Metrics
- **Initial Page Load**: < 3s
- **Component Render Time**: < 100ms
- **Database Queries**: < 500ms average

## 🔧 Additional Optimizations to Implement

### 1. Service Worker for Caching
```bash
npm install next-pwa
```

### 2. Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/placeholder.jpg"
  width={300}
  height={200}
  alt="Plaza image"
  placeholder="blur"
  priority={isAboveFold}
/>
```

### 3. Virtualization for Large Lists
```bash
npm install @tanstack/react-virtual
```

### 4. Preload Critical Resources
```tsx
// In your page components
import Head from 'next/head'

<Head>
  <link rel="preload" href="/api/customers" as="fetch" />
  <link rel="modulepreload" href="/critical-component.js" />
</Head>
```

## 📈 Measuring Performance

### 1. Development Monitoring
Performance metrics are automatically logged to console in development mode.

### 2. Production Analytics
Consider integrating with:
- **Google Analytics 4**: For Core Web Vitals
- **Vercel Analytics**: For performance insights
- **Sentry**: For error and performance monitoring

### 3. Bundle Analysis
Run `npm run analyze` regularly to:
- Identify growing dependencies
- Find unused code
- Optimize chunk sizes

## 🗃️ Database Performance Tips

### 1. Indexing Strategy
```sql
-- Add indexes for commonly queried columns
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_bills_customer_id ON bills(customer_id);
CREATE INDEX idx_bills_status_date ON bills(status, created_at);
```

### 2. Query Optimization Patterns
```tsx
// ❌ Bad: Fetching all data
const customers = await supabase.from('customers').select('*')

// ✅ Good: Selective fields + pagination
const customers = await client.select('customers', {
  columns: 'id, name, email, status',
  limit: 50,
  cacheTTL: 5 * 60 * 1000
})

// ✅ Good: Efficient counting
const { count } = await supabaseUtils.getCount(client, 'customers', { status: 'active' })
```

### 3. Real-time Optimization
```tsx
// ❌ Bad: Subscribe to all changes
supabase.from('customers').on('*', callback)

// ✅ Good: Filtered subscriptions
client.subscribe('customers', callback, {
  filter: 'status=eq.active'
})
```

## 🚦 Performance Checklist

### Before Deployment
- [ ] Run `npm run analyze` and verify bundle sizes
- [ ] Check all images are optimized and use Next.js Image
- [ ] Verify database queries are cached appropriately
- [ ] Test Core Web Vitals with Lighthouse
- [ ] Ensure critical resources are preloaded

### Regular Monitoring
- [ ] Weekly bundle analysis
- [ ] Monitor Core Web Vitals in production
- [ ] Review slow database queries
- [ ] Check for memory leaks in long-running sessions

### When Adding New Features
- [ ] Use dynamic imports for heavy components
- [ ] Implement proper loading states
- [ ] Cache database queries when appropriate
- [ ] Add performance monitoring for new components

## 🛠️ Troubleshooting Common Issues

### Large Bundle Size
1. Use dynamic imports for heavy components
2. Check for duplicate dependencies with `npm ls`
3. Consider splitting vendor chunks further

### Slow Database Queries
1. Add appropriate indexes
2. Use the caching layer
3. Implement pagination
4. Consider denormalization for read-heavy tables

### Poor Core Web Vitals
1. Optimize images and use WebP/AVIF formats
2. Minimize layout shifts with fixed dimensions
3. Preload critical resources
4. Use proper loading states

## 📚 Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Core Web Vitals](https://web.dev/vitals/)
- [Supabase Performance Tips](https://supabase.com/docs/guides/database/performance)
- [React Performance Patterns](https://kentcdodds.com/blog/optimize-react-re-renders)
