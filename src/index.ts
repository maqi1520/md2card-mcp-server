#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { WechatScraper } from "./wechat-scraper.js";
import { MD2CardConverter } from "./md2card-converter.js";

class MD2CardServer {
  private server: Server;
  private API_KEY: string;
  private wechatScraper: WechatScraper;
  private md2CardConverter: MD2CardConverter;

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
    this.wechatScraper = new WechatScraper();
    this.md2CardConverter = new MD2CardConverter(this.API_KEY);

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
                enum: [
                  "apple-notes",
                  "coil-notebook",
                  "pop-art",
                  "bytedance",
                  "alibaba",
                  "art-deco",
                  "glassmorphism",
                  "warm",
                  "minimal",
                  "dreamy",
                  "nature",
                  "xiaohongshu",
                  "notebook",
                  "darktech",
                  "typewriter",
                  "watercolor",
                  "traditional-chinese",
                  "fairytale",
                  "business",
                  "japanese-magazine",
                  "minimalist",
                  "cyberpunk",
                  "meadow-dawn",
                ],
              },
              themeMode: {
                type: "string",
                description:
                  "卡片主题模式（默认模式/粉蓝模式/薄荷模式/紫色模式/蓝色模式/粉色模式/黄色模式/亮色模式/暗黑模式）",
                enum: [
                  "default-mode",
                  "pink-blue-mode",
                  "mint-mode",
                  "purple-mode",
                  "blue-mode",
                  "pink-mode",
                  "yellow-mode",
                  "light-mode",
                  "dark-mode",
                ],
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
        {
          name: "wechat_scraper",
          description: "抓取微信公众号文章并转换为 Markdown 格式",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "微信公众号文章的 URL 地址",
              },
            },
            required: ["url"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        try {
          if (request.params.name !== "md2card_api" && request.params.name !== "wechat_scraper") {
            throw new McpError(ErrorCode.MethodNotFound, "未知工具");
          }

          // Handle WeChat scraper
          if (request.params.name === "wechat_scraper") {
            const { url } = request.params.arguments;
            
            if (!url) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "请提供微信公众号文章的URL"
              );
            }

            try {
              const markdownContent = await this.wechatScraper.scrapeArticle(url);
              return {
                content: [
                  {
                    type: "text",
                    text: markdownContent,
                  },
                ],
              };
            } catch (error) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      error: true,
                      message: error instanceof Error ? error.message : "抓取失败",
                    }),
                  },
                ],
                isError: true,
              };
            }
          }

          // Handle md2card_api (existing functionality)
          if (!this.API_KEY) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "请配置MD2CARD_API_KEY环境变量"
            );
          }

          // Handle md2card_api using the converter
          const {
            markdown,
            markdownFile,
            type,
            width,
            height,
            theme,
            themeMode,
            splitMode,
            mdxMode,
            overHiddenMode,
          } = request.params.arguments;

          try {
            const result = await this.md2CardConverter.convertToCard({
              markdown,
              markdownFile,
              type,
              width,
              height,
              theme,
              themeMode,
              splitMode,
              mdxMode,
              overHiddenMode,
            });

            const markdownResult = this.md2CardConverter.formatResultAsMarkdown(result);
            
            return {
              content: [
                {
                  type: "text",
                  text: markdownResult,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    error: true,
                    message: error instanceof Error ? error.message : "转换失败",
                  }),
                },
              ],
              isError: true,
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
