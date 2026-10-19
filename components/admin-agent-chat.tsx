"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@ai-sdk/workflow/client";
import { SquareTerminal } from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

const SUGGESTIONS = [
  "Show me low-stock items",
  "What were yesterday's top sellers?",
  "Summarize this week's revenue",
];

export function AdminAgentChat() {
  const [input, setInput] = useState("");

  const { messages, error, sendMessage } = useChat({
    // useChat defaults to /api/chat (the shopping agent); point at the admin agent instead.
    transport: new WorkflowChatTransport({ api: "/api/admin/chat" }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((m) =>
            m.parts.map((p, i) => {
              switch (p.type) {
                case "text":
                  return (
                    <Message key={`${m.id}-${i}`} from={m.role}>
                      <MessageContent>
                        <MessageResponse>{p.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                case "tool-bash": {
                  const input = p.input as { command?: string } | undefined;
                  const output = p.output as
                    | { stdout?: string; stderr?: string }
                    | undefined;
                  return (
                    <div
                      key={`${m.id}-${i}`}
                      className="my-2 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 font-mono text-sm"
                    >
                      <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-800/50 px-3 py-2 text-neutral-400">
                        <SquareTerminal className="size-4" aria-hidden="true" />
                        <span className="text-xs">
                          {p.state === "output-available"
                            ? "Terminal"
                            : "Running…"}
                        </span>
                      </div>
                      <div className="px-3 py-2">
                        <div className="font-semibold text-neutral-100">
                          $ {input?.command}
                        </div>
                        {p.state === "output-available" && output && (
                          <div className="mt-1 text-neutral-300">
                            {output.stdout && (
                              <pre className="whitespace-pre-wrap">
                                {output.stdout}
                              </pre>
                            )}
                            {output.stderr && (
                              <pre className="whitespace-pre-wrap text-red-400">
                                {output.stderr}
                              </pre>
                            )}
                          </div>
                        )}
                        {p.state !== "output-available" && (
                          <div className="mt-1 flex items-center gap-1 text-neutral-500">
                            <span className="animate-pulse">▊</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                default:
                  return null;
              }
            }),
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col gap-3 border-t p-3">
        <Suggestions>
          {SUGGESTIONS.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={handleSuggestionClick}
            />
          ))}
        </Suggestions>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask the admin agent…"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status="ready" disabled={!input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
