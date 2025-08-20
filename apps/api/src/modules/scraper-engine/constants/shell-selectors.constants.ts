export const SHELL_SELECTORS = {
  // Category selection
  categoriesList: 'ul.iframe-list.list-1LGB5dx',
  categoryItems:
    'ul.iframe-list.list-1LGB5dx li[role="option"] a.option-3DQsuX8, ul.iframe-list.list-1LGB5dx li[role="option"] a, ul.iframe-list li[role="option"] a',
  categoryItemByText: (text: string) => `ul.iframe-list.list-1LGB5dx li[role="option"] a:has-text("${text}")`,

  // Navigation
  backButton: 'button.back-button-2vAH8oM[aria-label="Home"]',
  homeButton: 'button[aria-label="Home"]',

  // Search form
  searchForm: 'div.search-form-1sDkgBA',
  searchInput: 'input[name="model"][placeholder="Search by make and model"]',
  searchSubmitButton: 'button.submit-41lbJN7',
  searchIcon: 'span[data-icon="search-small"]',
  searchInput2: '.input-3eRHBaU > input',

  // Results
  resultsWrapper: 'div.results-wrapper-xweNxh5',
  resultsHeader: 'p.header-3QScycK span',
  resultItems: 'ul.results-3t4ZeVL li.result-item-2YEGk_G',
  resultButton: 'button.result-link-efvsTu3',
  resultModel: 'p.car-type-1CWK6Cg',
  resultDescription: 'div.model-info-w7JYTCw p:nth-child(2)',
  resultYears: 'p.years-1dxTdAt',

  // Filters (for future use)
  filtersWrapper: 'div.filters-wrapper-PcWhgpM',
  yearFilter: 'div[role="combobox"] button:has-text("Year")',
  fuelTypeFilter: 'div[role="combobox"] button:has-text("Fuel type")',
  engineSizeFilter: 'div[role="combobox"] button:has-text("Engine Size")',

  // Recommendation page
  recommendationTitle: 'h1.title-2s_WFVy:has-text("Recommendation")',
  vehicleInfo: 'h2.search-brand-ymIIQ9x',
  vehicleBrand: 'h2.search-brand-ymIIQ9x strong',
  vehicleModel: 'h2.search-brand-ymIIQ9x small',

  // Accordion sections
  accordionItems: 'div.toggler-1-LMflx',
  accordionTitle: 'span.title-inner-1xIJJCT',
  accordionCapacity: 'span.capacity-item-1ehAlIH',
  accordionRecommendation: 'dl.variants-3KqNOff',
  accordionRecommendationType: 'dl.variants-3KqNOff dt',
  accordionRecommendationProduct: 'dl.variants-3KqNOff dd',
  accordionDataSheets: 'dl.options-rwbdnfP a',
  accordionToggleButton: 'button.toggle-icon-XpfVZ7m',

  // Loading states
  loader: 'span[data-icon="loader"]',
  resultsLoading: 'div.results-wrapper-xweNxh5[style*="opacity: 0"]',
}

// Legacy selectors for backward compatibility
export const SHELL_IFRAME_SELECTORS = {
  iframe: 'iframe, frame',
  iframeBody: 'body',
  searchForm: 'div.search-form-1sDkgBA',
  vehicleSelect: 'select, .vehicle-selector, #vehicle-dropdown',
  modelSelect: 'select[name*="model"], .model-selector, #model-dropdown',
  yearSelect: 'select[name*="year"], .year-selector, #year-dropdown',
  engineOilSection: '.engine-oil, [data-category="engine-oil"], :has-text("Engine Oil")',
  transmissionOilSection: '.transmission-oil, [data-category="transmission"], :has-text("Transmission")',
  antifreezeSection: '.antifreeze, [data-category="antifreeze"], :has-text("Antifreeze")',
  productCard: '.product-card, .oil-recommendation, .product-tile',
  productImage: 'img, .product-image, .oil-image',
  productTitle: 'h3, h4, .product-title, .oil-title',
  productSpecs: '.specs, .specifications, .product-details',
}
