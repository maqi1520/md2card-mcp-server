import axios from "axios";
import fs from "fs";
import path from "path";

export interface MD2CardOptions {
  markdown?: string;
  markdownFile?: string;
  type?: string;
  width?: number;
  height?: number;
  theme?: string;
  themeMode?: string;
  splitMode?: string;
  mdxMode?: boolean;
  overHiddenMode?: boolean;
}

export interface MD2CardResult {
  success: boolean;
  images?: Array<{ fileName: string; url: string; size: number }>;
  previewUrl?: string;
  cost?: number;
  error?: string;
}

export class MD2CardConverter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async convertToCard(options: MD2CardOptions): Promise<MD2CardResult> {
    const processedOptions = await this.processOptions(options);
    const requestBody = this.buildRequestBody(processedOptions);

    try {
      const response = await axios.post(
        "https://md2card.cn/api/generate",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
        }
      );

      if (!response.data) {
        throw new Error("无效的API响应");
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API请求失败: ${error.response?.data?.message || error.message}`);
      } else {
        throw new Error(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  private async processOptions(options: MD2CardOptions): Promise<MD2CardOptions> {
    let processedOptions = { ...options };

    if (options.markdownFile && !options.markdown) {
      processedOptions.markdown = await this.readMarkdownFromFile(options.markdownFile);
    }

    if (!processedOptions.markdown) {
      throw new Error("请提供markdown内容或markdown文件路径");
    }

    return this.applyMappings(processedOptions);
  }

  private async readMarkdownFromFile(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Markdown文件 ${resolvedPath} 不存在`);
    }

    const content = fs.readFileSync(resolvedPath, "utf-8");
    console.log(`成功从文件 ${resolvedPath} 读取Markdown内容`);
    
    return content;
  }

  private applyMappings(options: MD2CardOptions): MD2CardOptions {
    const mappedOptions = { ...options };

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

    const sizeMap: Record<string, { width: number; height: number }> = {
      小红书: { width: 440, height: 586 },
      正方形: { width: 500, height: 500 },
      手机海报: { width: 440, height: 782 },
      A4纸打印: { width: 595, height: 842 },
    };

    const splitModeMap: Record<string, string> = {
      自动拆分: "autoSplit",
      横线拆分: "hrSplit",
      不拆分: "noSplit",
      长图文: "noSplit",
    };

    if (mappedOptions.theme) {
      mappedOptions.theme = themeMap[mappedOptions.theme] || mappedOptions.theme;
    }

    if (mappedOptions.themeMode) {
      mappedOptions.themeMode = themeModeMap[mappedOptions.themeMode] || mappedOptions.themeMode;
    }

    if (mappedOptions.splitMode) {
      mappedOptions.splitMode = splitModeMap[mappedOptions.splitMode] || mappedOptions.splitMode;
    }

    let finalWidth = mappedOptions.width || 440;
    let finalHeight = mappedOptions.height || 586;

    if (mappedOptions.type && typeof mappedOptions.type === "string") {
      console.log(`处理type参数: "${mappedOptions.type}"`);
      
      if (sizeMap[mappedOptions.type]) {
        finalWidth = sizeMap[mappedOptions.type].width;
        finalHeight = sizeMap[mappedOptions.type].height;
        console.log(`使用类型预设(完全匹配): ${mappedOptions.type} (${finalWidth}x${finalHeight})`);
      } else {
        let found = false;
        for (const [presetName, presetSize] of Object.entries(sizeMap)) {
          console.log(`尝试匹配: "${mappedOptions.type}" 是否包含 "${presetName}"`);
          if (mappedOptions.type.includes(presetName)) {
            finalWidth = presetSize.width;
            finalHeight = presetSize.height;
            console.log(`使用类型预设(部分匹配): ${presetName} (${finalWidth}x${finalHeight})`);
            found = true;
            break;
          }
        }

        if (!found && (mappedOptions.type.includes("A4") || mappedOptions.type.includes("a4"))) {
          console.log(`检测到A4关键字，尝试匹配A4纸打印`);
          finalWidth = sizeMap["A4纸打印"].width;
          finalHeight = sizeMap["A4纸打印"].height;
          console.log(`使用A4纸打印预设: (${finalWidth}x${finalHeight})`);
        }
      }
    }

    mappedOptions.width = finalWidth;
    mappedOptions.height = finalHeight;

    return mappedOptions;
  }

  private buildRequestBody(options: MD2CardOptions): any {
    return {
      markdown: options.markdown,
      theme: options.theme || "apple-notes",
      themeMode: options.themeMode,
      width: options.width || 440,
      height: options.height || 586,
      splitMode: options.splitMode || "noSplit",
      mdxMode: options.mdxMode || false,
      overHiddenMode: options.overHiddenMode || false,
    };
  }

  formatResultAsMarkdown(result: MD2CardResult): string {
    if (!result.success) {
      return JSON.stringify(result);
    }

    const images = result.images || [];
    const imageLinks = images
      .map((img) => `[${img.fileName}](${img.url})\n图片大小：${img.size} KB`)
      .join("\n");

    const markdownResult = `**下载图片**\n${imageLinks}\n\n**在线编辑**\n[点击在线编辑](${result.previewUrl})\n\n- 本次消耗积分：${result.cost}`;
    
    return markdownResult;
  }
}