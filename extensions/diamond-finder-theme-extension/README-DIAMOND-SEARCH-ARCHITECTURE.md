# Diamond Search Architecture Documentation

## Overview

The Diamond Search functionality has been refactored into a modular architecture with better separation of concerns. This document outlines the structure and purpose of each module.

## File Structure

### JavaScript Modules (assets/)

1. **`diamond-state.js`** - State Management
   - Global state management for the application
   - Filter state, pagination state, UI state
   - Configuration constants and defaults
   - State manipulation methods

2. **`diamond-api.js`** - Data Layer
   - API communication and data fetching
   - Query string building from filters
   - Error handling for network requests
   - Data transformation and validation

3. **`diamond-renderer.js`** - Rendering & Display
   - Diamond sorting logic
   - Diamond card creation and rendering
   - Results display and count updates
   - Grid layout management

4. **`diamond-filters.js`** - Filter Components
   - Slider initialization and management
   - Filter button group logic
   - Certificate filter handling (multi-select)
   - Input field synchronization

5. **`diamond-ui.js`** - UI Components & Events
   - User interface interactions
   - Event handling for various UI components
   - Visual feedback and animations
   - Infinite scroll implementation

6. **`diamond-search-main.js`** - Application Controller
   - Main application initialization
   - Module coordination and startup sequence
   - Cross-module communication setup

### Liquid Templates (blocks/ and snippets/)

#### Main Block
- **`blocks/diamond_search.liquid`** - Main entry point, loads modules and renders sections

#### Filter Components (snippets/)
- **`diamond-search-filters.liquid`** - Main filter container
- **`diamond-search-shape-filter.liquid`** - Shape selection filter
- **`diamond-search-price-filter.liquid`** - Price range filter with sliders
- **`diamond-search-carat-filter.liquid`** - Carat range filter with dropdowns
- **`diamond-search-colour-filter.liquid`** - Color filter with images and slider
- **`diamond-search-clarity-filter.liquid`** - Clarity filter with slider
- **`diamond-search-cut-grade-filter.liquid`** - Cut grade filter with slider

#### Other Components
- **`diamond-search-results.liquid`** - Results display and sorting
- **`filter-button-group.liquid`** - Reusable button group component
- **`certificate-filter-group.liquid`** - Certificate multi-select component

## Module Dependencies

```
diamond-search-main.js (Application Controller)
├── diamond-state.js (State Management)
├── diamond-api.js (Data Layer)
│   └── diamond-state.js
├── diamond-renderer.js (Rendering)
│   └── diamond-state.js
├── diamond-filters.js (Filter Components)
│   └── diamond-state.js
│   └── diamond-api.js
└── diamond-ui.js (UI Components)
    └── diamond-state.js
    └── diamond-filters.js
    └── diamond-api.js
```

## Initialization Flow

1. **Page Load**: HTML loads with modular script tags
2. **Module Loading**: JavaScript modules load in dependency order
3. **State Initialization**: Global state object is created
4. **Slider Setup**: All sliders are initialized
5. **UI Setup**: Event handlers and interactions are configured
6. **Initial Load**: Default filters are applied and data is fetched

## Key Features

### State Management
- Centralized state in `window.DiamondSearchState`
- Immutable state updates through dedicated methods
- Clear separation between UI state and data state

### Modular Filters
- Each filter type has its own component
- Reusable filter button groups
- Consistent event handling across all filters

### API Integration
- Clean separation between UI and data fetching
- Centralized query building
- Consistent error handling

### Performance Optimizations
- Debounced filter updates
- Infinite scroll for pagination
- Lazy loading of advanced filters

## Benefits of New Architecture

1. **Maintainability**: Smaller, focused files that are easier to understand and modify
2. **Reusability**: Components can be reused across different contexts
3. **Testability**: Individual modules can be tested in isolation
4. **Scalability**: New features can be added without affecting existing code
5. **Separation of Concerns**: Clear boundaries between different responsibilities

## Migration Notes

The new modular structure maintains full backward compatibility with the existing API endpoints and maintains all existing functionality. The original `diamond-search.js` file can be removed once the new modules are verified to work correctly.

## Development Guidelines

1. **Adding New Filters**: Create new snippet components and add initialization in `diamond-filters.js`
2. **UI Changes**: Modify the appropriate UI module or create new snippets
3. **State Changes**: Update state management methods in `diamond-state.js`
4. **API Changes**: Modify query building and data handling in `diamond-api.js`

## File Size Reduction

The original monolithic files have been broken down as follows:
- **Original**: `diamond-search.js` (~1018 lines)
- **New Structure**: 6 focused modules (~200-300 lines each)
- **Original**: `diamond_search.liquid` (~178 lines)
- **New Structure**: 1 main block + 9 focused snippets (~10-30 lines each)

This modular approach significantly improves code organization and maintainability.