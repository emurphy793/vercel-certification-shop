import { WorkflowAgent, type ModelCallStreamPart } from "@ai-sdk/workflow";
import { getWritable } from "workflow";
import { convertToModelMessages, type UIMessage } from "ai";
import { shoppingAgentInstructions } from "@/lib/instructions";
import {
  getAllCategories,
  getProductDetails,
  returnOrder,
  searchProducts,
} from "@/lib/tools";

export async function chatFlow(messages: UIMessage[]) {
  "use workflow";

  const modelMessages = await convertToModelMessages(messages);

  const agent = new WorkflowAgent({
    model: "anthropic/claude-sonnet-5",
    instructions: shoppingAgentInstructions,
    tools: { searchProducts, getProductDetails, getAllCategories, returnOrder },
  });

  await agent.stream({
    messages: modelMessages,
    writable: getWritable<ModelCallStreamPart>(),
  });
}
