// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { LoadingOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Download, Headphones,Presentation } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { LoadingAnimation } from "~/components/deer-flow/loading-animation";
import { Markdown } from "~/components/deer-flow/markdown";
import { RainbowText } from "~/components/deer-flow/rainbow-text";
import { RollingText } from "~/components/deer-flow/rolling-text";
import {
  ScrollContainer,
  type ScrollContainerRef,
} from "~/components/deer-flow/scroll-container";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Message, Option } from "~/core/messages";
import {
  closeResearch,
  openResearch,
  useLastFeedbackMessageId,
  useLastInterruptMessage,
  useMessage,
  useMessageIds,
  useResearchMessage,
  useStore,
} from "~/core/store";
import { parseJSON } from "~/core/utils";
import { cn } from "~/lib/utils";

export function MessageListView({
  className,
  onFeedback,
  onSendMessage,
}: {
  className?: string;
  onFeedback?: (feedback: { option: Option }) => void;
  onSendMessage?: (
    message: string,
    options?: { interruptFeedback?: string },
  ) => void;
}) {
  const scrollContainerRef = useRef<ScrollContainerRef>(null);
  const messageIds = useMessageIds();
  const interruptMessage = useLastInterruptMessage();
  const waitingForFeedbackMessageId = useLastFeedbackMessageId();
  const responding = useStore((state) => state.responding);
  const noOngoingResearch = useStore(
    (state) => state.ongoingResearchId === null,
  );
  const ongoingResearchIsOpen = useStore(
    (state) => state.ongoingResearchId === state.openResearchId,
  );

  const handleToggleResearch = useCallback(() => {
    // Fix the issue where auto-scrolling to the bottom
    // occasionally fails when toggling research.
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollToBottom();
      }
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <ScrollContainer
      className={cn("flex h-full w-full flex-col overflow-hidden", className)}
      scrollShadowColor="var(--app-background)"
      autoScrollToBottom
      ref={scrollContainerRef}
    >
      <ul className="flex flex-col">
        {messageIds.map((messageId) => (
          <MessageListItem
            key={messageId}
            messageId={messageId}
            waitForFeedback={waitingForFeedbackMessageId === messageId}
            interruptMessage={interruptMessage}
            onFeedback={onFeedback}
            onSendMessage={onSendMessage}
            onToggleResearch={handleToggleResearch}
          />
        ))}
        <div className="flex h-8 w-full shrink-0"></div>
      </ul>
      {responding && (noOngoingResearch || !ongoingResearchIsOpen) && (
        <LoadingAnimation className="ml-4" />
      )}
    </ScrollContainer>
  );
}

function MessageListItem({
  className,
  messageId,
  waitForFeedback,
  interruptMessage,
  onFeedback,
  onSendMessage,
  onToggleResearch,
}: {
  className?: string;
  messageId: string;
  waitForFeedback?: boolean;
  onFeedback?: (feedback: { option: Option }) => void;
  interruptMessage?: Message | null;
  onSendMessage?: (
    message: string,
    options?: { interruptFeedback?: string },
  ) => void;
  onToggleResearch?: () => void;
}) {
  const message = useMessage(messageId);
  const researchIds = useStore((state) => state.researchIds);
  const startOfResearch = useMemo(() => {
    return researchIds.includes(messageId);
  }, [researchIds, messageId]);
  if (message) {
    if (
      message.role === "user" ||
      message.agent === "coordinator" ||
      message.agent === "planner" ||
      message.agent === "podcast" ||
      startOfResearch
    ) {
      let content: React.ReactNode;
      if (message.agent === "planner") {
        content = (
          <div className="w-full px-4">
            <PlanCard
              message={message}
              waitForFeedback={waitForFeedback}
              interruptMessage={interruptMessage}
              onFeedback={onFeedback}
              onSendMessage={onSendMessage}
            />
          </div>
        );
      } else if (message.agent === "podcast") {
        content = (
          <div className="w-full px-4">
            <PodcastCard message={message} />
          </div>
        );
      } else if (startOfResearch) {
        content = (
          <div className="w-full px-4">
            <ResearchCard
              researchId={message.id}
              onToggleResearch={onToggleResearch}
            />
          </div>
        );
      } else {
        content = message.content ? (
          <div
            className={cn(
              "flex w-full px-4",
              message.role === "user" && "justify-end",
              className,
            )}
          >
            <MessageBubble message={message}>
              <div className="flex w-full flex-col">
                <Markdown>{message?.content}</Markdown>
              </div>
            </MessageBubble>
          </div>
        ) : null;
      }
      if (content) {
        return (
          <motion.li
            className="mt-10"
            key={messageId}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transition: "all 0.2s ease-out" }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {content}
          </motion.li>
        );
      }
    }
    return null;
  }
}

function MessageBubble({
  className,
  message,
  children,
}: {
  className?: string;
  message: Message;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        `flex w-fit max-w-[85%] flex-col rounded-2xl px-4 py-3 shadow`,
        message.role === "user" &&
          "text-primary-foreground bg-brand rounded-ee-none",
        message.role === "assistant" && "bg-card rounded-es-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ResearchCard({
  className,
  researchId,
  onToggleResearch,
}: {
  className?: string;
  researchId: string;
  onToggleResearch?: () => void;
}) {
  const reportId = useStore((state) => state.researchReportIds.get(researchId));
  const hasReport = reportId !== undefined;
  const reportGenerating = useStore(
    (state) => hasReport && state.messages.get(reportId)!.isStreaming,
  );
  const openResearchId = useStore((state) => state.openResearchId);
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false); 

  const state = useMemo(() => {
    if (hasReport) {
      return reportGenerating ? "正在生成報告..." : "報告已生成";
    }
    return "正在搜索資料...";
  }, [hasReport, reportGenerating]);
  const msg = useResearchMessage(researchId);
  const title = useMemo(() => {
    if (msg) {
      return parseJSON(msg.content ?? "", { title: "" }).title;
    }
    return undefined;
  }, [msg]);
  const handleOpen = useCallback(() => {
    if (openResearchId === researchId) {
      closeResearch();
    } else {
      openResearch(researchId);
    }
    onToggleResearch?.();
  }, [openResearchId, researchId, onToggleResearch]);

  // 新增PPT生成函数
  const handleGeneratePPT = useCallback(async () => {
    if (!hasReport || reportGenerating) return;
    
    setIsGeneratingPPT(true);
    try {
      const reportMessage = useStore.getState().messages.get(reportId!);
      const response = await fetch("http://localhost:8000/api/ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reportMessage?.content || "" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PPT");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "presentation"}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PPT:", error);
    } finally {
      setIsGeneratingPPT(false);
    }
  }, [hasReport, reportGenerating, reportId, title]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>
          <RainbowText animated={state !== "正在生成報告..."}>
            {title !== undefined && title !== "" ? title : "深度搜索"}
          </RainbowText>
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <div className="flex w-full items-center gap-2">
          <RollingText className="text-muted-foreground flex-grow text-sm">
            {state}
          </RollingText>
          <div className="flex gap-2"> {/* 新增：将按钮包装在div中 */}
            {hasReport && !reportGenerating && ( /* 新增：PPT按钮 */
              <Tooltip title="生成PPT">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isGeneratingPPT}
                  onClick={handleGeneratePPT}
                >
                  {isGeneratingPPT ? (
                    <LoadingOutlined />
                  ) : (
                    <Presentation size={16} />
                  )}
                </Button>
              </Tooltip>
            )}
          <Button
            variant={!openResearchId ? "default" : "outline"}
            onClick={handleOpen}
          >
            {researchId !== openResearchId ? "開啟" : "關閉"}
          </Button>
        </div>
        </div>
      </CardFooter>
    </Card>
  );
}

const GREETINGS = ["Cool", "Sounds great", "Looks good", "Great", "Awesome"];
function PlanCard({
  className,
  message,
  interruptMessage,
  onFeedback,
  waitForFeedback,
  onSendMessage,
}: {
  className?: string;
  message: Message;
  interruptMessage?: Message | null;
  onFeedback?: (feedback: { option: Option }) => void;
  onSendMessage?: (
    message: string,
    options?: { interruptFeedback?: string },
  ) => void;
  waitForFeedback?: boolean;
}) {
  const plan = useMemo<{
    title?: string;
    thought?: string;
    steps?: { title?: string; description?: string }[];
  }>(() => {
    return parseJSON(message.content ?? "", {});
  }, [message.content]);
  const handleAccept = useCallback(async () => {
    if (onSendMessage) {
      onSendMessage(
        `${GREETINGS[Math.floor(Math.random() * GREETINGS.length)]}! ${Math.random() > 0.5 ? "Let's get started." : "Let's start."}`,
        {
          interruptFeedback: "accepted",
        },
      );
    }
  }, [onSendMessage]);
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>
          <Markdown animated>
            {`### ${
              plan.title !== undefined && plan.title !== ""
                ? plan.title
                : "Deep Research"
            }`}
          </Markdown>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Markdown className="opacity-80" animated>
          {plan.thought}
        </Markdown>
        {plan.steps && (
          <ul className="my-2 flex list-decimal flex-col gap-4 border-l-[2px] pl-8">
            {plan.steps.map((step, i) => (
              <li key={`step-${i}`}>
                <h3 className="mb text-lg font-medium">
                  <Markdown animated>{step.title}</Markdown>
                </h3>
                <div className="text-muted-foreground text-sm">
                  <Markdown animated>{step.description}</Markdown>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!message.isStreaming && interruptMessage?.options?.length && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {interruptMessage?.options.map((option) => (
              <Button
                key={option.value}
                variant={option.value === "accepted" ? "default" : "outline"}
                disabled={!waitForFeedback}
                onClick={() => {
                  if (option.value === "accepted") {
                    void handleAccept();
                  } else {
                    onFeedback?.({
                      option,
                    });
                  }
                }}
              >
                {option.text}
              </Button>
            ))}
          </motion.div>
        )}
      </CardFooter>
    </Card>
  );
}

function PodcastCard({
  className,
  message,
}: {
  className?: string;
  message: Message;
}) {
  const data = useMemo(() => {
    return JSON.parse(message.content ?? "");
  }, [message.content]);
  const title = useMemo<string | undefined>(() => data?.title, [data]);
  const audioUrl = useMemo<string | undefined>(() => data?.audioUrl, [data]);
  const isGenerating = useMemo(() => {
    return message.isStreaming;
  }, [message.isStreaming]);
  const hasError = useMemo(() => {
    return data?.error !== undefined;
  }, [data]);
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <Card className={cn("w-[508px]", className)}>
      <CardHeader>
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isGenerating ? <LoadingOutlined /> : <Headphones size={16} />}
            {!hasError ? (
              <RainbowText animated={isGenerating}>
                {isGenerating
                  ? "正在生成播客..."
                  : isPlaying
                    ? "正在播放播客..."
                    : "播客"}
              </RainbowText>
            ) : (
              <div className="text-red-500">
                Error when generating podcast. Please try again.
              </div>
            )}
          </div>
          {!hasError && !isGenerating && (
            <div className="flex">
              <Tooltip title="Download podcast">
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={audioUrl}
                    download={`${(title ?? "podcast").replaceAll(" ", "-")}.mp3`}
                  >
                    <Download size={16} />
                  </a>
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
        <CardTitle>
          <div className="text-lg font-medium">
            <RainbowText animated={isGenerating}>{title}</RainbowText>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {audioUrl ? (
          <audio
            className="w-full"
            src={audioUrl}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="w-full"></div>
        )}
      </CardContent>
    </Card>
  );
}
