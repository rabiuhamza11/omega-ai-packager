/**
 * HarzDM Marketplace Integration for omega-pack
 * 
 * Provides typed helpers for interacting with the HarzDM
 * digital marketplace backend (catalog, checkout, orders).
 */

export interface HarzDMProduct {
  id: string;
  title: string;
  description: string;
  category: 'Ebook' | 'Course' | 'Template' | 'Software' | 'Music' | 'AIPrompt' | 'Photo' | 'Plugin';
  price: number;
  currency: string;
  seller_name: string;
  seller_email: string;
  image_url?: string;
  file_url?: string;
  sales_count: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface HarzDMOrder {
  product_id: string;
  product_title: string;
  buyer_email: string;
  buyer_name: string;
  amount: number;
  currency: string;
  seller_email: string;
  payment_status: 'pending' | 'paid' | 'failed';
  stripe_session_id: string;
  download_url: string;
}

export interface HarzDMCheckoutRequest {
  product_id: string;
  buyer_email: string;
  buyer_name: string;
}

export interface HarzDMCheckoutResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
  product: { title: string; price: number };
}

const BASE_URL = 'https://superagent-2286fb2f.base44.app/functions';

/**
 * HarzDM API client — interact with the live marketplace
 */
export class HarzDMClient {
  /**
   * Fetch the full product catalog
   */
  static async getCatalog(opts?: {
    category?: HarzDMProduct['category'];
    search?: string;
  }): Promise<{ products: HarzDMProduct[]; total_products: number; total_sellers: number }> {
    const params = new URLSearchParams();
    if (opts?.category) params.set('category', opts.category);
    if (opts?.search) params.set('search', opts.search);

    const res = await fetch(`${BASE_URL}/harzDMCatalog?${params}`);
    if (!res.ok) throw new Error(`HarzDM catalog error: ${res.status}`);
    return res.json();
  }

  /**
   * Create a Stripe checkout session for a product
   */
  static async checkout(req: HarzDMCheckoutRequest): Promise<HarzDMCheckoutResponse> {
    const res = await fetch(`${BASE_URL}/harzDMCheckout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Checkout failed: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Get top products by sales
   */
  static async getTopProducts(limit = 10): Promise<HarzDMProduct[]> {
    const { products } = await HarzDMClient.getCatalog();
    return products
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, limit);
  }

  /**
   * Get products by category
   */
  static async getByCategory(category: HarzDMProduct['category']): Promise<HarzDMProduct[]> {
    const { products } = await HarzDMClient.getCatalog({ category });
    return products;
  }
}

/**
 * omega-pack manifest snippet for HarzDM integration
 *
 * Add to your omega.agent.yml:
 *
 * integrations:
 *   harzdm:
 *     catalog_url: https://superagent-2286fb2f.base44.app/functions/harzDMCatalog
 *     checkout_url: https://superagent-2286fb2f.base44.app/functions/harzDMCheckout
 *     marketplace_url: https://harzdm-shop.vercel.app
 */
export const HARZDM_CONFIG = {
  catalogUrl: `${BASE_URL}/harzDMCatalog`,
  checkoutUrl: `${BASE_URL}/harzDMCheckout`,
  sellerSignupUrl: `${BASE_URL}/harzDMSellerSignup`,
  dashboardUrl: `${BASE_URL}/harzDMDashboard`,
  marketplaceUrl: 'https://harzdm-shop.vercel.app',
  githubUrl: 'https://github.com/rabiuhamza11/harzdm-marketplace',
} as const;
