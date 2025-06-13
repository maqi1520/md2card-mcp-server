#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import fs from "fs";
import path from "path";

class MD2CardServer {
  private server: Server;
  private API_KEY: string;

  constructor() {
    this.server = new Server(
      {
        name: "md2card",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.API_KEY = process.env.MD2CARD_API_KEY || "";

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: "md2card_api",
          description: "将 Markdown 文档转换为精美的知识卡片",
          inputSchema: {
            type: "object",
            properties: {
              markdown: { type: "string", description: "Markdown内容" },
              markdownFile: { type: "string", description: "Markdown文件路径" },
              type: {
                type: "string",
                description: "卡片类型（小红书/正方形/手机海报/A4纸打印）",
              },
              width: {
                type: "number",
                default: 440,
                description: "卡片宽度",
              },
              height: { type: "number", default: 586, description: "卡片高度" },
              theme: {
                type: "string",
                default: "apple-notes",
                description:
                  "卡片主题（默认：苹果备忘录）（苹果备忘录/线圈笔记本/波普艺术/字节范/阿里橙/艺术装饰/玻璃拟态/温暖柔和/简约高级灰/梦幻渐变/清新自然/紫色小红书/笔记本/暗黑科技/复古打字机/水彩艺术/中国传统/儿童童话/商务简报/日本杂志/极简黑白/赛博朋克/青野晨光）",
              },
              themeMode: {
                type: "string",
                description:
                  "卡片主题模式（默认模式/粉蓝模式/薄荷模式/紫色模式/蓝色模式/粉色模式/黄色模式/亮色模式/暗黑模式）",
              },
              splitMode: {
                type: "string",
                default: "noSplit",
                description: "卡片拆分模式",
              },
              mdxMode: {
                type: "boolean",
                default: false,
                description: "是否启用MDX模式",
              },
              overHiddenMode: {
                type: "boolean",
                default: false,
                description: "是否启用超出高度隐藏",
              },
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        try {
          if (request.params.name !== "md2card_api") {
            throw new McpError(ErrorCode.MethodNotFound, "未知工具");
          }

          if (!this.API_KEY) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "请配置MD2CARD_API_KEY环境变量"
            );
          }

          // 参数映射处理
          let {
            markdown,
            markdownFile,
            type,
            width = 440,
            height = 586,
            theme = "apple-notes",
            themeMode,
            splitMode = "noSplit",
            mdxMode = false,
            overHiddenMode = false,
          } = request.params.arguments;

          // 如果提供了markdownFile，尝试从文件读取markdown内容
          if (markdownFile && !markdown) {
            try {
              const filePath = path.resolve(markdownFile);
              if (fs.existsSync(filePath)) {
                markdown = fs.readFileSync(filePath, "utf-8");
                console.log(`成功从文件 ${filePath} 读取Markdown内容`);
              } else {
                throw new McpError(
                  ErrorCode.InvalidParams,
                  `Markdown文件 ${filePath} 不存在`
                );
              }
            } catch (error: any) {
              throw new McpError(
                ErrorCode.InvalidParams,
                `读取Markdown文件失败: ${error.message}`
              );
            }
          }

          // 确保至少有markdown内容
          if (!markdown) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "请提供markdown内容或markdown文件路径"
            );
          }

          // 主题映射
          const themeMap: Record<string, string> = {
            苹果备忘录: "apple-notes",
            线圈笔记本: "coil-notebook",
            波普艺术: "pop-art",
            字节范: "bytedance",
            阿里橙: "alibaba",
            艺术装饰: "art-deco",
            玻璃拟态: "glassmorphism",
            温暖柔和: "warm",
            简约高级灰: "minimal",
            梦幻渐变: "dreamy",
            清新自然: "nature",
            紫色小红书: "xiaohongshu",
            笔记本: "notebook",
            暗黑科技: "darktech",
            复古打字机: "typewriter",
            水彩艺术: "watercolor",
            中国传统: "traditional-chinese",
            儿童童话: "fairytale",
            商务简报: "business",
            日本杂志: "japanese-magazine",
            极简黑白: "minimalist",
            赛博朋克: "cyberpunk",
            青野晨光: "meadow-dawn",
          };

          // 主题模式映射
          const themeModeMap: Record<string, string> = {
            默认: "default-mode",
            粉蓝模式: "pink-blue-mode",
            薄荷模式: "mint-mode",
            紫色模式: "purple-mode",
            蓝色模式: "blue-mode",
            粉色模式: "pink-mode",
            黄色模式: "yellow-mode",
            亮色模式: "light-mode",
            暗黑模式: "dark-mode",
          };

          // 尺寸预设映射
          const sizeMap: Record<string, { width: number; height: number }> = {
            小红书: { width: 440, height: 586 }, // 3:4比例
            正方形: { width: 500, height: 500 },
            手机海报: { width: 440, height: 782 }, // 9:16比例
            A4纸打印: { width: 595, height: 842 },
          };

          // 拆分模式映射
          const splitModeMap: Record<string, string> = {
            自动拆分: "autoSplit",
            横线拆分: "hrSplit",
            不拆分: "noSplit",
            长图文: "noSplit",
          };

          // 处理参数
          const finalTheme = themeMap[theme] || theme;
          let finalWidth = width;
          let finalHeight = height;
          const finalSplitMode = splitModeMap[splitMode] || splitMode;

          // 首先检查type参数
          if (type && typeof type === "string") {
            console.log(`处理type参数: "${type}"`);
            // 直接查找完全匹配的预设
            if (sizeMap[type]) {
              finalWidth = sizeMap[type].width;
              finalHeight = sizeMap[type].height;
              console.log(
                `使用类型预设(完全匹配): ${type} (${finalWidth}x${finalHeight})`
              );
            } else {
              // 检查是否包含预设名称
              let found = false;
              for (const [presetName, presetSize] of Object.entries(sizeMap)) {
                console.log(`尝试匹配: "${type}" 是否包含 "${presetName}"`);
                if (type.includes(presetName)) {
                  finalWidth = presetSize.width;
                  finalHeight = presetSize.height;
                  console.log(
                    `使用类型预设(部分匹配): ${presetName} (${finalWidth}x${finalHeight})`
                  );
                  found = true;
                  break;
                }
              }

              // 处理可能的空格问题 - 特别检查A4纸打印
              if (!found && (type.includes("A4") || type.includes("a4"))) {
                console.log(`检测到A4关键字，尝试匹配A4纸打印`);
                finalWidth = sizeMap["A4纸打印"].width;
                finalHeight = sizeMap["A4纸打印"].height;
                console.log(`使用A4纸打印预设: (${finalWidth}x${finalHeight})`);
              }
            }
          }

          // 严格按照API要求的格式构造请求体
          const requestBody = {
            markdown: markdown,
            theme: finalTheme,
            themeMode: themeModeMap[themeMode] || themeMode,
            width: finalWidth,
            height: finalHeight,
            splitMode: finalSplitMode,
            mdxMode: mdxMode,
            overHiddenMode: overHiddenMode,
          };

          const response = await axios.post(
            "https://md2card.cn/api/generate",
            requestBody,
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": this.API_KEY,
              },
            }
          );

          if (!response.data) {
            throw new McpError(ErrorCode.InternalError, "无效的API响应");
          }
          if (response.data.success) {
            // 以markdown格式拼接返回内容
            const images: { fileName: string; url: string; size: number }[] =
              response.data.images || [];
            const imageLinks = images
              .map(
                (img) =>
                  `[${img.fileName}](${img.url})\n图片大小：${img.size} KB`
              )
              .join("\n");
            const markdownResult = `**下载图片**\n${imageLinks}\n\n**在线编辑**\n[点击在线编辑](${response.data.previewUrl})\n\n- 本次消耗积分：${response.data.cost}`;
            return {
              content: [
                {
                  type: "text",
                  text: markdownResult,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(response.data),
                },
              ],
            };
          }
        } catch (error) {
          console.error("转换失败:", error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: error instanceof Error ? error.message : "未知错误",
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log("MD2Card服务器已启动");
    } catch (error) {
      console.error("服务器启动失败:", error);
      process.exit(1);
    }
  }
}

// 启动服务器
new MD2CardServer().run().catch((err) => {
  console.error("服务器运行错误:", err);
  process.exit(1);
});
