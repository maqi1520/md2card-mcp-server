# Markdown 转知识卡片

MD2Card 是一款将 Markdown 文档转换为精美知识卡片的工具。

## 主要特点

- 支持 22 种主题样式
- 智能尺寸适配
- 三种内容拆分模式
- 通过 MCP 协议提供标准化接口

## 如何使用

1. 安装 md2card-mcp-server
2. 设置 API 密钥
3. 提供 Markdown 内容或文件路径
4. 获取生成的卡片链接

## 示例代码

```javascript
{
  "markdown": "# 标题\n\n内容"
}
```

或者直接提供 Markdown 文件路径：

```javascript
{
  "markdownFile": "/path/to/your/file.md"
}
```
