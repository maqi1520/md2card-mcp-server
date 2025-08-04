import * as cheerio from "cheerio";
import TurndownService from "turndown";
import https from "https";

export interface WeChatArticleData {
  title: string;
  author: string;
  description: string;
  ogImage: string;
  content: string;
}

export interface WechatScraperOptions {
  userAgent?: string;
  headers?: Record<string, string>;
}

export class WechatScraper {
  private options: WechatScraperOptions;

  constructor(options: WechatScraperOptions = {}) {
    this.options = {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://www.google.com/",
      },
      ...options,
    };
  }

  async scrapeArticle(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          "User-Agent": this.options.userAgent,
          ...this.options.headers,
        },
      };

      https
        .get(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              try {
                const articleData = this.parseArticleContent(data);
                const markdown = this.formatArticleAsMarkdown(articleData);
                resolve(markdown);
              } catch (error) {
                reject(new Error(`Failed to parse content: ${error instanceof Error ? error.message : 'Unknown error'}`));
              }
            } else {
              reject(new Error(`Failed to retrieve page content. Status code: ${res.statusCode}`));
            }
          });
        })
        .on("error", (err) => {
          reject(new Error(`Network error: ${err.message}`));
        });
    });
  }

  private parseArticleContent(html: string): WeChatArticleData {
    const $ = cheerio.load(html);

    const title = $(".rich_media_title").text().trim() || "wechat_article";
    const description = $('meta[name="description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const author = $('meta[name="author"]').attr("content") || "";

    const $content = $(".rich_media_content");
    
    if ($content.length === 0) {
      throw new Error("Could not find rich_media_content section");
    }

    const contentHtml = $content.html();
    
    if (!contentHtml) {
      throw new Error("Content is empty");
    }

    const markdownContent = this.convertHtmlToMarkdown(contentHtml);

    return {
      title,
      author,
      description,
      ogImage,
      content: markdownContent,
    };
  }

  private convertHtmlToMarkdown(html: string): string {
    const turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
    });

    turndownService.addRule("wechatImage", {
      filter: ["img"],
      replacement: function (content, node) {
        const imgNode = node as unknown as cheerio.TagElement;
        const src = imgNode.attribs["data-src"] || imgNode.attribs["src"];
        const alt = imgNode.attribs["alt"] || "";
        return src ? `![${alt}](${src})` : "";
      },
    });

    turndownService.addRule("pre", {
      filter: "pre",
      replacement: function (content) {
        return "```\n" + content + "\n```";
      },
    });

    turndownService.remove(["script", "style"]);

    return turndownService.turndown(html);
  }

  private formatArticleAsMarkdown(data: WeChatArticleData): string {
    let markdown = "";

    markdown += `# ${data.title}\n\n`;

    if (data.author) {
      markdown += `**作者**: ${data.author}\n\n`;
    }

    if (data.description) {
      markdown += `${data.description}\n\n`;
    }

    if (data.ogImage) {
      markdown += `![封面](${data.ogImage})\n\n`;
    }

    markdown += "---\n\n";

    markdown += data.content;

    return markdown;
  }
}