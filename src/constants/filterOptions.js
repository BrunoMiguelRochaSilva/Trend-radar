// Shared option lists for date-range/sort controls used on both the Product
// Discovery filter panel and the Product Details page — kept in one place so
// the two stay in sync (both map directly to Kalodata's documented values).

export const DATE_RANGE_OPTIONS = [
  { value: 'lastDay', label: 'Last Day' },
  { value: 'last7Day', label: 'Last 7 Days' },
  { value: 'last30Day', label: 'Last 30 Days' },
];

// Kalodata's level-1 TikTok Shop (US) categories — ids are the `data-path-key`
// values from Kalodata's own category picker, sent as product/rank `category_ids`.
export const CATEGORY_OPTIONS = [
  { value: '605196', label: 'Automotive & Motorcycle' },
  { value: '602284', label: 'Baby & Maternity' },
  { value: '601450', label: 'Beauty & Personal Care' },
  { value: '801928', label: 'Books, Magazines & Audio' },
  { value: '951432', label: 'Collectibles' },
  { value: '601755', label: 'Computers & Office Equipment' },
  { value: '605248', label: 'Fashion Accessories' },
  { value: '700437', label: 'Food & Beverages' },
  { value: '604453', label: 'Furniture' },
  { value: '700645', label: 'Health' },
  { value: '604968', label: 'Home Improvement' },
  { value: '600001', label: 'Home Supplies' },
  { value: '600942', label: 'Household Appliances' },
  { value: '953224', label: 'Jewelry Accessories & Derivatives' },
  { value: '802184', label: "Kids' Fashion" },
  { value: '600024', label: 'Kitchenware' },
  { value: '824584', label: 'Luggage & Bags' },
  { value: '824328', label: 'Menswear & Underwear' },
  { value: '602118', label: 'Pet Supplies' },
  { value: '601739', label: 'Phones & Electronics' },
  { value: '856720', label: 'Pre-Owned' },
  { value: '601352', label: 'Shoes' },
  { value: '603014', label: 'Sports & Outdoor' },
  { value: '600154', label: 'Textiles & Soft Furnishings' },
  { value: '604579', label: 'Tools & Hardware' },
  { value: '604206', label: 'Toys & Hobbies' },
  { value: '834312', label: 'Virtual Products' },
  { value: '601152', label: 'Womenswear & Underwear' },
];
