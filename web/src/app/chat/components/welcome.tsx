// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { motion } from "framer-motion";

import { cn } from "~/lib/utils";

export function Welcome({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("flex flex-col", className)}
      style={{ transition: "all 0.2s ease-out" }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h3 className="mb-2 text-center text-3xl font-medium">
        👋 Hello, Dear~!
      </h3>
      <div className="text-muted-foreground px-4 text-center text-lg">
        歡迎來到{" "}
        <a
          // href="https://github.com/bytedance/deer-flow"
          // target="_blank"
          // rel="noopener noreferrer"
          // className="hover:underline"
        >
          😊 AVAZONE DeepResearch
        </a>
        , 我是一個擅長深度調研的AI，能夠幫助您檢索網站，搜羅全網資訊，處理各種複雜任務。
      </div>
    </motion.div>
  );
}
