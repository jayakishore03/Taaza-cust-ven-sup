/**
 * Products Context
 * Provides global product caching and instant access to products
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllProducts, getProductsByCategory } from '../lib/services/products';
import { CATEGORIES, type Product } from '../data/dummyData';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  getProductsByShopType: (shopType: string) => Product[];
  getProductsByCategory: (category: string) => Product[];
  getProductById: (id: string) => Product | null;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefetch all products on mount
  const fetchAllProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('[ProductsContext] Fetching all products...');
      const startTime = Date.now();

      // Fetch all categories in parallel for maximum speed
      const categoryPromises = CATEGORIES.map(category => 
        getProductsByCategory(category, undefined)
      );
      
      const categoryResults = await Promise.all(categoryPromises);
      const allProducts = categoryResults.flat();

      // Remove duplicates (if any product appears in multiple categories)
      const uniqueProducts = Array.from(
        new Map(allProducts.map(p => [p.id, p])).values()
      );

      const loadTime = Date.now() - startTime;
      console.log(`[ProductsContext] ✅ Loaded ${uniqueProducts.length} products in ${loadTime}ms`);
      
      setProducts(uniqueProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      console.error('[ProductsContext] Error loading products:', errorMessage);
      setError(errorMessage);
      // Don't clear products on error - keep existing data
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllProducts(false);
  }, [fetchAllProducts]);

  // Refresh products (called manually when needed)
  const refreshProducts = useCallback(async () => {
    await fetchAllProducts(true);
  }, [fetchAllProducts]);

  // Get products by shop type (instant - no API call)
  // Filters products based on shop type: chicken -> Chicken, mutton -> Mutton, pork -> Pork, meat -> Seafood, multi -> All
  const getProductsByShopType = useCallback((shopType: string | null | undefined): Product[] => {
    if (!shopType) {
      console.warn('[ProductsContext] Shop type is null/undefined, returning all products');
      return products; // Return all products as fallback
    }

    const shopTypeLower = shopType.toLowerCase().trim();

    // For multi shops, return all products
    if (shopTypeLower === 'multi') {
      console.log('[ProductsContext] Multi shop type detected, returning all products');
      return products;
    }

    // Map shop type to category (same as vendor app logic)
    const categoryMap: Record<string, string> = {
      'chicken': 'Chicken',
      'mutton': 'Mutton',
      'pork': 'Pork',
      'meat': 'Seafood', // 'meat' shop type maps to 'Seafood' category
    };

    const category = categoryMap[shopTypeLower];
    if (!category) {
      console.warn(`[ProductsContext] Unknown shop type: "${shopType}", returning all products`);
      return products; // Return all products as fallback
    }

    // Filter products by category (instant - from cache)
    const filtered = products.filter(p => p.category === category);
    console.log(`[ProductsContext] Filtered ${filtered.length} products for shop type "${shopType}" (category: "${category}")`);
    return filtered;
  }, [products]);

  // Get products by category (instant - no API call)
  const getProductsByCategoryInstant = useCallback((category: string): Product[] => {
    if (category === 'All') {
      return products;
    }
    return products.filter(p => p.category === category);
  }, [products]);

  // Get product by ID (instant - no API call)
  const getProductById = useCallback((id: string): Product | null => {
    return products.find(p => p.id === id) || null;
  }, [products]);

  const value: ProductsContextType = {
    products,
    isLoading,
    isRefreshing,
    error,
    getProductsByShopType,
    getProductsByCategory: getProductsByCategoryInstant,
    getProductById,
    refreshProducts,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}

