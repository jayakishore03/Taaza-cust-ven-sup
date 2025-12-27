-- ============================================
-- FIX PRODUCT WEIGHTS AND PRICES
-- Standardize weights to 250g, 500g, 750g, 1kg increments
-- Round price_per_kg to 2 decimal places
-- ============================================

-- STEP 1: Standardize weights to common values
-- Round to nearest standard weight: 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.75, 0.8, 0.9, 1.0

-- Round 0.225 → 0.25 (250g)
UPDATE products 
SET weight_in_kg = 0.25, 
    weight = '250 g',
    price = ROUND((price_per_kg * 0.25)::numeric, 2)
WHERE weight_in_kg = 0.225;

-- Round 0.15 → 0.15 (150g) - Keep as is, but update weight text
UPDATE products 
SET weight = '150 g'
WHERE weight_in_kg = 0.15;

-- Round 0.43 → 0.45 (450g)
UPDATE products 
SET weight_in_kg = 0.45,
    weight = '450 g',
    price = ROUND((price_per_kg * 0.45)::numeric, 2)
WHERE weight_in_kg = 0.43;

-- Round 0.35 → 0.35 (350g) - Keep as is, but update weight text
UPDATE products 
SET weight = '350 g'
WHERE weight_in_kg = 0.35;

-- Round 0.55 → 0.5 (500g)
UPDATE products 
SET weight_in_kg = 0.5,
    weight = '500 g',
    price = ROUND((price_per_kg * 0.5)::numeric, 2)
WHERE weight_in_kg = 0.55;

-- Update all empty weight strings to show actual weight
UPDATE products
SET weight = 
  CASE 
    WHEN weight_in_kg >= 1.0 THEN CONCAT(weight_in_kg, ' kg')
    WHEN weight_in_kg = 0.75 THEN '750 g'
    WHEN weight_in_kg = 0.5 THEN '500 g'
    WHEN weight_in_kg = 0.45 THEN '450 g'
    WHEN weight_in_kg = 0.4 THEN '400 g'
    WHEN weight_in_kg = 0.35 THEN '350 g'
    WHEN weight_in_kg = 0.3 THEN '300 g'
    WHEN weight_in_kg = 0.25 THEN '250 g'
    WHEN weight_in_kg = 0.2 THEN '200 g'
    WHEN weight_in_kg = 0.15 THEN '150 g'
    WHEN weight_in_kg = 0.1 THEN '100 g'
    ELSE CONCAT(ROUND((weight_in_kg * 1000)::numeric), ' g')
  END
WHERE weight = '' OR weight IS NULL;

-- STEP 2: Round price_per_kg to 2 decimal places
UPDATE products 
SET price_per_kg = ROUND(price_per_kg::numeric, 2);

-- STEP 3: Ensure price matches weight_in_kg * price_per_kg (rounded to 2 decimals)
UPDATE products 
SET price = ROUND((price_per_kg * weight_in_kg)::numeric, 2);

-- STEP 4: Round original_price if it exists
UPDATE products 
SET original_price = ROUND(original_price::numeric, 2)
WHERE original_price IS NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check weights distribution
SELECT 
  weight_in_kg,
  weight,
  COUNT(*) as count
FROM products
GROUP BY weight_in_kg, weight
ORDER BY weight_in_kg;

-- Check for any prices with more than 2 decimal places
SELECT 
  name,
  weight,
  weight_in_kg,
  price,
  price_per_kg,
  -- Check if there are more than 2 decimal places
  CASE 
    WHEN price::text LIKE '%.____%' THEN 'HAS EXTRA DECIMALS'
    WHEN price_per_kg::text LIKE '%.____%' THEN 'HAS EXTRA DECIMALS'
    ELSE 'OK'
  END as status
FROM products
WHERE 
  price::text LIKE '%.____%' 
  OR price_per_kg::text LIKE '%.____%';

-- Show sample of updated products
SELECT 
  name,
  category,
  weight,
  weight_in_kg,
  price,
  price_per_kg
FROM products
ORDER BY category, name
LIMIT 20;

-- ============================================
-- SUCCESS!
-- Products now have standardized weights and rounded prices
-- ============================================

