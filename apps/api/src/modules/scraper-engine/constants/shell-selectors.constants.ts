export const SHELL_SELECTORS = {
  // Search elements
  searchInput:
    'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], #search-input, .search-input',
  searchButton:
    'button[type="submit"], button:has-text("Search"), button:has-text("search"), #search-button, .search-button',
  clearButton:
    'button[aria-label="Clear"], button:has-text("Clear"), button:has-text("clear"), #clear-button, .clear-button',

  // Results elements
  resultsContainer: '[data-results], .results-container, #results, .search-results, .results',
  resultItem: '[data-result-item], .result-item, .search-result, .vehicle-option, .car-model',
  modelName: '[data-model-name], .model-name, .vehicle-name, .car-name, .model',
  modelYear: '[data-model-year], .model-year, .year, .vehicle-year',

  // Product page elements
  productContainer: '[data-products], .products-container, #products, .product-recommendations, .oil-products',
  productCategory: '[data-product-category], .product-category, .oil-category, .category-section',
  categoryTitle: '[data-category-title], .category-title, .category-name, h3, h4',
  productItem: '[data-product-item], .product-item, .oil-product, .product',
  productName: '[data-product-name], .product-name, .oil-name, .name',
  productGrade: '[data-product-grade], .product-grade, .grade, .viscosity',
  productVolume: '[data-product-volume], .product-volume, .volume, .size',
  productDescription: '[data-product-description], .product-description, .description',

  // Navigation
  backButton: 'button:has-text("Back"), button:has-text("back"), button[aria-label="Back"], #back-button, .back-button',
  nextButton: 'button:has-text("Next"), button:has-text("next"), button[aria-label="Next"], #next-button, .next-button',

  // Loading states
  loadingIndicator: '.loading, .spinner, [data-loading], .loader',

  // Error states
  errorMessage: '.error, .error-message, [data-error], .alert-error',
  noResults: '.no-results, .no-data, .empty-results, :has-text("No results")',

  // Generic fallbacks
  clickableElements: 'button, a, [role="button"], [tabindex="0"]',
  textInputs: 'input[type="text"], input[type="search"], input:not([type])',
}

// Iframe-specific selectors for Shell website
export const SHELL_IFRAME_SELECTORS = {
  iframe: 'iframe, frame',
  iframeBody: 'body',

  // Updated based on actual Shell website structure
  // Note: These will need to be updated after inspecting the real Shell website
  searchForm: 'form, .search-form, #oil-finder-form',
  vehicleSelect: 'select, .vehicle-selector, #vehicle-dropdown',
  modelSelect: 'select[name*="model"], .model-selector, #model-dropdown',
  yearSelect: 'select[name*="year"], .year-selector, #year-dropdown',

  // Product recommendation sections
  engineOilSection: '.engine-oil, [data-category="engine-oil"], :has-text("Engine Oil")',
  transmissionOilSection: '.transmission-oil, [data-category="transmission"], :has-text("Transmission")',
  antifreezeSection: '.antifreeze, [data-category="antifreeze"], :has-text("Antifreeze")',

  // Product details
  productCard: '.product-card, .oil-recommendation, .product-tile',
  productImage: 'img, .product-image, .oil-image',
  productTitle: 'h3, h4, .product-title, .oil-title',
  productSpecs: '.specs, .specifications, .product-details',
}
