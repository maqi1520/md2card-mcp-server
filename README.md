# MD2Card MCP 服务器

homepage: https://md2card.cn

MD2Card
Markdown 转知识卡片
将 Markdown 文档转换为精美的知识卡片，支持多种风格

## 安装与使用

### 方法一：使用 npx（推荐）

直接使用 npx 运行（需要设置 API 密钥环境变量）：

```bash
# 设置API密钥并运行
MD2CARD_API_KEY="您的API密钥" npx md2card-mcp-server
```

### 方法二：全局安装

```bash
# 安装
npm install -g md2card-mcp-server

# 运行（需要设置API密钥环境变量）
MD2CARD_API_KEY="您的API密钥" md2card-mcp-server
```

### 方法三：本地配置

clone 项目到本地，找到 index.js 路径替换到客户端 mcp 配置文件中

## 功能特性

- 支持 22 种主题样式：苹果备忘录 波普艺术 艺术装饰 玻璃拟态 温暖柔和 简约高级灰 梦幻渐变 清新自然 紫色小红书 笔记本 暗黑科技 复古打字机 水彩艺术 中国传统 儿童童话 商务简报 日本杂志 极简黑白 赛博朋克
- 智能尺寸适配
- 三种内容拆分模式：默认自动拆分
- 通过 MCP 协议提供标准化接口
- **新功能**：支持直接读取 Markdown 文件
- **新功能**：支持通过 type 参数直接指定卡片类型/尺寸

## 使用方法

### 方法一：提供 Markdown 内容

```json
{
  "markdown": "# 标题\n\n内容"
}
```

### 方法二：提供 Markdown 文件路径

```json
{
  "markdownFile": "/path/to/your/file.md"
}
```

### 方法三：指定卡片类型/尺寸

可以通过`type`参数直接指定卡片类型，支持以下类型：

- 小红书：440x586
- 正方形：500x500
- 手机海报：440x782
- A4 纸打印：595x842

```json
{
  "markdown": "# 标题\n\n内容",
  "type": "小红书"
}
```

也可以通过 width 和 height 参数指定：

```json
{
  "markdown": "# 标题\n\n内容",
  "width": "小红书",
  "height": 586
}
```

## 客户端配置

### 通用 MCP 客户端配置

在 MCP 客户端配置文件中添加以下内容：

```json
{
  "md2card-server": {
    "command": "npx",
    "args": ["md2card-mcp-server@latest"],
    "env": {
      "MD2CARD_API_KEY": "您的API密钥"
    }
  }
}
```

### Cursor 客户端配置

在 Cursor 的 MCP 客户端配置文件中添加以下内容：

```json
{
  "md2card-server": {
    "command": "npx",
    "args": ["-y", "md2card-mcp-server@latest"],
    "env": {
      "MD2CARD_API_KEY": "您的API密钥"
    }
  }
}
```

> 注意：MD2CARD_API_KEY 环境变量是必需的，只有在实际运行时才会检查此环境变量。安装包时不需要此环境变量。

密钥申请地址：https://md2card.cn/zh?referralCode=github
