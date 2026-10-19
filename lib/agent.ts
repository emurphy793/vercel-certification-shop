import {
  ToolLoopAgent,
  type InferAgentUIMessage,
  type UIToolInvocation,
} from "ai";
import {
  getAllCategories,
  getProductDetails,
  returnOrder,
  searchProducts,
} from "@/lib/tools";
import { shoppingAgentInstructions } from "@/lib/instructions";

export const shoppingAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5",
  instructions: shoppingAgentInstructions,
  tools: { searchProducts, getProductDetails, getAllCategories, returnOrder },
});

export type ShoppingAgentUIMessage = InferAgentUIMessage<typeof shoppingAgent>;
export type SearchProductsToolInvocation = UIToolInvocation<
  typeof searchProducts
>;
export type ProductDetailsToolInvocation = UIToolInvocation<
  typeof getProductDetails
>;
