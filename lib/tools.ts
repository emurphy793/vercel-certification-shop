import { tool } from "ai";
import { z } from "zod";
import { start } from "workflow/api";
import {
  ApiRequestError,
  getCategories,
  getProductById,
  getProducts,
  getProductStock,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { returnFlow } from "./workflows/return-flow";

export const searchProducts = tool({
  description: `Search the Vercel swag store product catalog. Use this for broad lookups: when the user asks what the store sells, wants to browse a type of product, or wants recommendations. Returns a short summary of up to 10 matching products. Do NOT use this to answer detailed questions about one specific product (stock, full description, images) — call getProductDetails with the product's id or slug instead. Optionally narrow results to a single category.`,
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        `Optional, free-text search terms describing what the user is looking for, e.g. 'hoodie' or 'water bottle'.`,
      ),
    category: z
      .string()
      .optional()
      .describe(
        `Optional category slug to filter results. Only set this when the user clearly wants a specific category. Use the getAllCategories tool to get all valid categories.`,
      ),
  }),
  execute: async ({ query, category }) => {
    "use step";
    try {
      const products = await getProducts({
        search: query,
        category,
        limit: 10,
      });
      return {
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images[0],
          price: p.price,
          currency: p.currency,
          category: p.category,
          description: p.description,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, products: [], error: message };
    }
  },
});

export const getProductDetails = tool({
  description: `Get the full details for ONE specific product: complete description, formatted price, every image, tags, live stock level, a link to its product page, and a few related products from the same category. Use this whenever the user asks about a particular item (e.g. "Tell me more about the black hoodie", "Is the crewneck tee in stock?", "How much is the mug?"), even if searchProducts already returned some of its fields. Requires the product's id or slug — if you only know the product's name, call searchProducts first to find it.`,
  inputSchema: z.object({
    product: z
      .string()
      .describe(
        `The product's id (e.g. 'hoodie_001') or slug (e.g. 'black-pullover-hoodie'), taken from a searchProducts result.`,
      ),
  }),
  execute: async ({ product: idOrSlug }) => {
    "use step";
    try {
      // Stock is best-effort: a failed stock lookup shouldn't hide the product.
      const [product, stock] = await Promise.all([
        getProductById(idOrSlug),
        getProductStock(idOrSlug).catch(() => null),
      ]);
      const related = await getProducts({
        category: product.category,
        limit: 5,
      }).catch(() => []);

      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          url: `/products/${product.slug}`,
          description: product.description,
          price: product.price,
          formattedPrice: formatPrice(product.price, product.currency),
          currency: product.currency,
          category: product.category,
          images: product.images,
          tags: product.tags,
          featured: product.featured,
          // The catalog doesn't track sizes or variants yet.
          sizes: null,
          stock: stock
            ? {
                quantity: stock.stock,
                inStock: stock.inStock,
                lowStock: stock.lowStock,
              }
            : null,
        },
        relatedProducts: related
          .filter((p) => p.id !== product.id)
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            formattedPrice: formatPrice(p.price, p.currency),
            image: p.images[0],
          })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { product: null, relatedProducts: [], error: message };
    }
  },
});

export const getAllCategories = tool({
  description: `List every product category available in the Vercel swag store, along with the number of products in each. Use this when the user asks what categories exist, what kinds of products are sold, or wants to browse the store at a high level.`,
  inputSchema: z.object({}),
  execute: async () => {
    "use step";
    try {
      const categories = await getCategories();
      return {
        count: categories.length,
        categories: categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          productCount: c.productCount,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, categories: [], error: message };
    }
  },
});

export const returnOrder = tool({
  description: `File a return for one of the user's past orders. The user must provide an order ID and a reason. Example order IDs: 11111, 22222, 33333. The return runs as a background workflow: this tool responds immediately once the request is received, before the return is filed.`,
  inputSchema: z.object({
    orderId: z.string().describe("The order ID the user wants to return."),
    reason: z
      .string()
      .min(10)
      .max(500)
      .describe("Why the user is returning the order."),
  }),
  execute: async ({ orderId, reason }) => {
    // Starting a child workflow from inside chatFlow has to happen in a step.
    "use step";
    const run = await start(returnFlow, [orderId, reason]);
    return {
      runId: run.runId,
      message: `Return request received for order ${orderId}.`,
    };
  },
});
