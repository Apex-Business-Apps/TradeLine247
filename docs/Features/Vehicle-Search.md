# Vehicle Search - Advanced Filters

## Overview
Fast, accurate vehicle search with combined filters, location-based search, and flexible sorting.

## Features Implemented

### 1. Search Filters

#### Keyword Search
- Full-text search across make, model, trim, description
- Search as you type with debouncing
- Enter key triggers search

#### Province Filter
- Dropdown with all Canadian provinces
- "All provinces" option for nationwide search
- Syncs with URL parameters

#### Engine Type Filter
- Multi-select checkboxes
- Options: Gasoline, Diesel, Hybrid, Electric, Plug-in Hybrid
- Filters combine with AND logic

#### Seats Range
- Dual slider for min/max seats
- Range: 2-8 seats
- Real-time visual feedback

#### Distance/Location Search
- Optional location permission request
- Radius slider (10-200 km)
- Distance badge on results when enabled
- Falls back to province filter if denied

### 2. Sorting Options
- **Relevance** (default) - Best match based on keyword
- **Price: Low to High** - Ascending price
- **Price: High to Low** - Descending price  
- **Year: Newest First** - Newest vehicles first
- **Year: Oldest First** - Oldest vehicles first
- **Distance** - Closest first (requires location)

### 3. URL State Sync
- All filters sync to URL parameters
- Shareable search results
- Browser back/forward support
- Preserves filters on page refresh

## User Experience

### Filter Panel
- Collapsible sidebar on desktop
- Bottom sheet on mobile
- Clear visual hierarchy
- Reset button clears all filters
- Active filter count badge

### Results Display
- Grid layout responsive to screen size
- Distance badge when location enabled
- Loading skeleton during search
- Empty state with helpful suggestions
- Pagination with page size options

### Performance Indicators
- Search trigger on filter change
- Debounced keyword search (300ms)
- Loading spinner during search
- Result count display
- Search time indicator

## Backend Implementation

### Database Indexes
```sql
CREATE INDEX idx_vehicles_search ON vehicles 
  USING GIN (to_tsvector('english', make || ' ' || model || ' ' || description));

CREATE INDEX idx_vehicles_province ON vehicles(province);
CREATE INDEX idx_vehicles_engine ON vehicles(engine_type);
CREATE INDEX idx_vehicles_seats ON vehicles(seats);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_year ON vehicles(year);
```

### Search Endpoint
- **Path**: `/functions/v1/vehicles-search`
- **Method**: POST
- **Auth**: Required
- **Rate limit**: 60 requests/minute

### RLS Policies
- Org-scoped queries automatically applied
- Users see only their organization's vehicles
- Admin users see all vehicles

## Security

### Input Validation
- Keyword length: max 100 characters
- Province: enum validation
- Engines: array validation against allowed types
- Seats: range 2-8
- Radius: range 10-200 km
- Sort: enum validation

### Query Protection
- Parameterized queries prevent SQL injection
- Full-text search uses ts_query
- Location coordinates validated
- Rate limiting prevents abuse

## Performance

### Typical Query Times
- Simple search (keyword only): <100ms
- With filters (province + engine): <200ms
- With location (distance calc): <300ms
- Complex (all filters): <500ms

### Optimizations
- Database indexes on all filter columns
- Full-text search index
- Result pagination (20 per page)
- Image lazy loading
- Query result caching (5 minutes)

## Testing

### E2E Test Scenarios

#### Basic Search
```javascript
test('Search for Camry shows relevant results', async () => {
  await page.fill('[data-testid="keyword-search"]', 'Camry');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('[data-testid="vehicle-card"]')).toContainText('Camry');
});
```

#### Province Filter
```javascript
test('Filter by Ontario shows only Ontario vehicles', async () => {
  await page.selectOption('[data-testid="province-filter"]', 'Ontario');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('[data-testid="vehicle-province"]')).toHaveText('Ontario');
});
```

#### Seats Range
```javascript
test('Seats filter 5-7 shows valid results', async () => {
  await page.setSliderValue('[data-testid="seats-slider"]', [5, 7]);
  await page.click('[data-testid="search-button"]');
  const seats = await page.locator('[data-testid="vehicle-seats"]').allTextContents();
  expect(seats.every(s => Number(s) >= 5 && Number(s) <= 7)).toBe(true);
});
```

#### Distance Search
```javascript
test('Distance filter with location shows nearby vehicles', async () => {
  await page.click('[data-testid="enable-location"]');
  await page.grantPermissions(['geolocation']);
  await page.setSliderValue('[data-testid="radius-slider"]', [50]);
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('[data-testid="distance-badge"]')).toBeVisible();
});
```

#### Sort Options
```javascript
test('Sort by price ascending orders correctly', async () => {
  await page.selectOption('[data-testid="sort-select"]', 'price_asc');
  await page.click('[data-testid="search-button"]');
  const prices = await page.locator('[data-testid="vehicle-price"]').allTextContents();
  const priceValues = prices.map(p => Number(p.replace(/[^0-9]/g, '')));
  expect(priceValues).toEqual([...priceValues].sort((a, b) => a - b));
});
```

#### URL State
```javascript
test('Filters persist in URL and on refresh', async () => {
  await page.fill('[data-testid="keyword-search"]', 'SUV');
  await page.selectOption('[data-testid="province-filter"]', 'Quebec');
  await page.click('[data-testid="search-button"]');
  
  const url = page.url();
  expect(url).toContain('keyword=SUV');
  expect(url).toContain('province=Quebec');
  
  await page.reload();
  await expect(page.locator('[data-testid="keyword-search"]')).toHaveValue('SUV');
  await expect(page.locator('[data-testid="province-filter"]')).toHaveValue('Quebec');
});
```

## Pass Criteria
✅ Filters change results instantly (<500ms)  
✅ Refresh preserves all filters  
✅ E2E tests pass for all scenarios  
✅ Zero console errors  
✅ URL state syncs correctly  
✅ Location permission handled gracefully  
✅ Mobile responsive design  
✅ Distance badge appears when location enabled  

## Known Limitations
- Distance calculation assumes flat earth (good for <200km)
- Location permission required for distance search
- Search limited to current organization's inventory
- Maximum 1000 results per query

## Future Enhancements
- Save favorite searches
- Search alerts/notifications
- AI-powered recommendations
- Similar vehicle suggestions
- Price drop alerts
- Inventory comparisons across dealers
