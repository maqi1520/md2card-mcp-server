# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that converts Markdown documents into beautiful knowledge cards. It provides a standardized interface for transforming Markdown content into visually appealing card formats with various themes and customization options.

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in build/ directory and set executable permissions
- `npm run watch` - Start TypeScript compiler in watch mode for development
- `npm run prepare` - Build the project (automatically runs on npm install)
- `npm run inspector` - Run the MCP inspector tool to test the server

## Architecture

### Core Components

1. **MD2CardServer Class** (src/index.ts:13) - Main server implementation
   - Handles MCP protocol communication
   - Manages API key authentication via MD2CARD_API_KEY environment variable
   - Orchestrates tool requests using separate modules

2. **WeChat Scraper Module** (src/wechat-scraper.ts) - WeChat article extraction
   - `WechatScraper` class handles article scraping functionality
   - Fetches WeChat articles via HTTPS with proper headers
   - Extracts title, author, description, and cover image
   - Converts HTML content to Markdown using Turndown
   - Handles image processing with data-src attributes
   - Configurable user agent and headers

3. **MD2Card Converter Module** (src/md2card-converter.ts) - Card conversion functionality
   - `MD2CardConverter` class handles markdown to card conversion
   - Processes options and mappings (theme, size, split modes)
   - Handles file reading for markdown files
   - Manages API communication with md2card.cn
   - Formats results as Markdown responses

4. **Tool Definitions** - Two MCP tools:
   - `md2card_api` - Converts Markdown to knowledge cards
   - `wechat_scraper` - Scrapes WeChat articles and converts to Markdown

### Key Features

- **22 Theme Styles**: Apple Notes, Pop Art, Art Deco, Glassmorphism, Warm, Minimal, Dreamy, Nature, etc.
- **Size Presets**: Xiaohongshu (440x586), Square (500x500), Mobile Poster (440x782), A4 Print (595x842)
- **Content Splitting**: Auto-split, horizontal rule split, no split modes
- **Theme Modes**: Default, pink-blue, mint, purple, blue, pink, yellow, light, dark modes
- **MDX Support**: Optional MDX mode processing
- **Overflow Control**: Option to hide content exceeding height limits
- **WeChat Article Scraping**: Extract and convert WeChat articles to Markdown format
- **Comprehensive Metadata Extraction**: Title, author, description, and cover image extraction

### Parameter Processing

The server handles complex parameter mapping:
- Chinese theme names mapped to English API values (src/index.ts:185)
- Size preset detection via `type` parameter (src/index.ts:247)
- Theme mode translation from Chinese to English (src/index.ts:212)
- Split mode mapping (src/index.ts:233)

### API Integration

- External API endpoint: `https://md2card.cn/api/generate`
- Authentication via `x-api-key` header using MD2CARD_API_KEY
- Returns image URLs, file sizes, and preview links in Markdown format
- Includes cost tracking for API usage

## Configuration Requirements

- **Environment Variable**: `MD2CARD_API_KEY` - Required for API authentication
- **TypeScript**: ES2022 target with Node16 module system
- **Build Output**: ./build directory with executable permissions

## MCP Integration

The server implements MCP protocol for tool-based integration:
- Stdio transport for communication
- Single tool `md2card_api` with comprehensive schema
- Error handling with proper MCP error codes
- Markdown-formatted responses for tool outputs

## Usage Patterns

### MD2Card Tool
Two primary input methods:
1. **Direct Markdown**: Provide markdown content as string
2. **File Path**: Provide local file path to read markdown content

Size specification methods:
1. **Preset Types**: Use `type` parameter with predefined names (小红书, 正方形, etc.)
2. **Custom Dimensions**: Specify `width` and `height` numerically
3. **Mixed**: Combine preset type with custom dimension overrides

### WeChat Scraper Tool
Input method:
1. **URL Parameter**: Provide WeChat article URL to scrape and convert to Markdown

The server automatically handles file reading, parameter validation, API communication, and WeChat article scraping, returning structured Markdown responses with download links, editing capabilities, and extracted article content.

### Dependencies
- **cheerio**: HTML parsing and manipulation for WeChat article extraction
- **turndown**: HTML to Markdown conversion with custom rules
- **Type definitions**: @types/cheerio and @types/turndown for TypeScript support