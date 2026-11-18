#!/usr/bin/env node
/**
 * TikTok Viral Hooks, Creator Emails & Brand Sponsor Intelligence MCP Server (tiktok-intelligence-mcp)
 * Dual-Transport Model Context Protocol (MCP) Server:
 *   1. Local stdio transport (default: `npx -y github:willowswt/tiktok-intelligence-mcp`)
 *   2. Streamable HTTP transport (`--http` or remote hosted endpoint `https://church-of-loujess--tiktok-intelligence-mcp.apify.actor/mcp`)
 *
 * Schema discovery (`initialize`, `tools/list`, `ping`, `resources/list`, `prompts/list`)
 * runs locally with zero latency and requires no API key.
 * Live tool execution (`tools/call`) routes through the cloud Standby cluster at:
 *   https://church-of-loujess--tiktok-intelligence-mcp.apify.actor/mcp
 * Get your free Apify API token ($5.00/mo free credit included) at:
 *   https://console.apify.com/settings/integrations
 * Apify Store listing & documentation:
 *   https://apify.com/church_of_loujess/tiktok-intelligence-mcp
 */

import http from 'node:http';
import readline from 'node:readline';
import crypto from 'node:crypto';

const SERVER_NAME = "tiktok-intelligence-mcp";
const SERVER_VERSION = '1.0.0';
const REMOTE_MCP_ENDPOINT = "https://church-of-loujess--tiktok-intelligence-mcp.apify.actor/mcp";
const STORE_URL = "https://apify.com/church_of_loujess/tiktok-intelligence-mcp";
const SUPPORTED_PROTOCOLS = new Set(['2025-06-18', '2025-03-26', '2024-11-05']);

const SERVER_INSTRUCTIONS = "Streamable-HTTP & stdio MCP server for TikTok video search, spoken viral hook & transcript extraction, creator email discovery, buyer-intent comment mining, and sponsor spying. Remote Streamable-HTTP endpoint: https://church-of-loujess--tiktok-intelligence-mcp.apify.actor/mcp | Store: https://apify.com/church_of_loujess/tiktok-intelligence-mcp";

const TOOLS = [
  {
    "name": "search_tiktok_videos",
    "description": "Search TikTok videos by keyword or hashtag (`keyword`) and return video IDs, URLs, captions, views, likes, comments, shares, bookmarks, outlier multiplier (views/followers), creator stats, and music metadata.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "TikTok search keyword or hashtag (e.g. \"saas founder\", \"skincare\")."
        },
        "maxResults": {
          "type": "integer",
          "description": "Maximum videos to return (1-20, default 8).",
          "default": 8
        }
      },
      "required": [
        "keyword"
      ]
    },
    "annotations": {
      "title": "Search Tiktok Videos",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "extract_viral_hooks_and_scripts",
    "description": "Extract timestamped first-3-second spoken hooks, body scripts, closing CTAs, speaking pace (WPM), hook archetype, and outlier virality multiplier from TikTok videos matching `keyword` or a specific `videoUrl`.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "TikTok niche keyword (e.g. \"marketing tips\"). Optional if `videoUrl` is set."
        },
        "videoUrl": {
          "type": "string",
          "description": "Optional direct TikTok video URL."
        },
        "hookWindowSeconds": {
          "type": "number",
          "description": "Opening hook window in seconds (default 3.5).",
          "default": 3.5
        },
        "maxResults": {
          "type": "integer",
          "description": "Maximum analyzed videos to return (1-15, default 5).",
          "default": 5
        }
      }
    },
    "annotations": {
      "title": "Extract Viral Hooks And Scripts",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "find_tiktok_creator_emails",
    "description": "Discover TikTok micro-influencers, UGC creators, and Shop affiliates in any niche (`keyword` or `handle`) and crawl external bio links (Linktree, Beacons, storefronts) to extract verified emails, Calendly links, and socials.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "Creator niche keyword (e.g. \"ugc creator\", \"fitness coach\")."
        },
        "handle": {
          "type": "string",
          "description": "Optional specific TikTok @username to enrich."
        },
        "maxCreators": {
          "type": "integer",
          "description": "Maximum creators to enrich (1-12, default 5).",
          "default": 5
        }
      }
    },
    "annotations": {
      "title": "Find Tiktok Creator Emails",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "mine_buyer_intent_comments",
    "description": "Scan TikTok video comments (`keyword` or `videoUrl`) for high-intent buyers asking \"where to buy\", \"link?\", \"price?\", \"what tool is this\", or competitor pain, scored 0-100 with commenter handles.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "Niche or competitor keyword (e.g. \"shopify tips\", \"crm software\")."
        },
        "videoUrl": {
          "type": "string",
          "description": "Optional specific TikTok video URL."
        },
        "maxLeads": {
          "type": "integer",
          "description": "Maximum buyer-intent comment leads to return (1-20, default 8).",
          "default": 8
        }
      }
    },
    "annotations": {
      "title": "Mine Buyer Intent Comments",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "spy_tiktok_brand_sponsors",
    "description": "Detect active DTC & SaaS brands sponsoring TikTok creators in any niche (`keyword`) via #ad, #sponsored, #partner, promo codes, and @brand tags, resolving brand domains and contact emails.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "Niche keyword (e.g. \"protein powder\", \"ai tools\", \"skincare\")."
        },
        "maxSponsors": {
          "type": "integer",
          "description": "Maximum sponsored campaign leads (1-15, default 6).",
          "default": 6
        }
      },
      "required": [
        "keyword"
      ]
    },
    "annotations": {
      "title": "Spy Tiktok Brand Sponsors",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "scan_breakout_tiktok_sounds",
    "description": "Discover trending and breakout TikTok audio/music tracks in any niche (`keyword`), returning sound IDs, titles, original vs. commercial flags, MP3 preview URLs, velocity score, and viral sample videos.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyword": {
          "type": "string",
          "description": "Niche keyword (e.g. \"gym motivation\", \"aesthetic vlog\")."
        },
        "maxSounds": {
          "type": "integer",
          "description": "Maximum sound trends to return (1-15, default 6).",
          "default": 6
        }
      },
      "required": [
        "keyword"
      ]
    },
    "annotations": {
      "title": "Scan Breakout Tiktok Sounds",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  }
];

async function forwardToolCallToRemote(name, args) {
    const token = (
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        process.env.MCP_API_TOKEN ||
        ''
    ).trim();

    if (!token) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            status: 'configuration_required',
                            server: SERVER_NAME,
                            tool: name,
                            message:
                                'APIFY_API_TOKEN is required to execute live data extraction tools. ' +
                                'Create a free Apify account ($5.00 monthly credit included) and copy your token from ' +
                                'https://console.apify.com/settings/integrations, or connect directly to the remote ' +
                                `Streamable-HTTP endpoint: ${REMOTE_MCP_ENDPOINT}`,
                            remoteStreamableHttpEndpoint: REMOTE_MCP_ENDPOINT,
                            apifyStoreUrl: STORE_URL,
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    const rpcPayload = {
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'tools/call',
        params: { name, arguments: args || {} },
    };

    const resp = await fetch(REMOTE_MCP_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rpcPayload),
    });

    if (!resp.ok) {
        const errBody = await resp.text();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: `Remote Standby HTTP ${resp.status}: ${errBody.slice(0, 400)}`,
                        endpoint: REMOTE_MCP_ENDPOINT,
                        storeUrl: STORE_URL,
                    }),
                },
            ],
            isError: true,
        };
    }

    const data = await resp.json();
    if (data && data.result) {
        return data.result;
    }
    if (data && data.error) {
        return {
            content: [{ type: 'text', text: JSON.stringify(data.error) }],
            isError: true,
        };
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
        isError: false,
    };
}

async function handleRpcMessage(msg) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
        return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' } };
    }
    const method = String(msg.method || '');
    const hasId = msg.id !== undefined && msg.id !== null;
    if (!hasId || method.startsWith('notifications/')) {
        return null;
    }
    const id = msg.id;
    const params = msg.params && typeof msg.params === 'object' ? msg.params : {};

    if (method === 'initialize') {
        const clientPv = String(params.protocolVersion || '2025-06-18');
        const protocolVersion = SUPPORTED_PROTOCOLS.has(clientPv) ? clientPv : '2025-06-18';
        return {
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion,
                capabilities: {
                    tools: { listChanged: false },
                    resources: { subscribe: false, listChanged: false },
                    prompts: { listChanged: false },
                },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
                instructions: SERVER_INSTRUCTIONS,
            },
        };
    }

    if (method === 'ping') {
        return { jsonrpc: '2.0', id, result: {} };
    }

    if (method === 'tools/list') {
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    }

    if (method === 'resources/list') {
        return { jsonrpc: '2.0', id, result: { resources: [] } };
    }

    if (method === 'resources/templates/list') {
        return { jsonrpc: '2.0', id, result: { resourceTemplates: [] } };
    }

    if (method === 'prompts/list') {
        return { jsonrpc: '2.0', id, result: { prompts: [] } };
    }

    if (method === 'tools/call') {
        const toolName = String(params.name || '').trim();
        const toolArgs = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};
        const toolDef = TOOLS.find((t) => t.name === toolName);
        if (!toolDef) {
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32602, message: `Unknown tool: ${toolName}` },
            };
        }
        for (const reqField of toolDef.inputSchema?.required || []) {
            if (toolArgs[reqField] === undefined || toolArgs[reqField] === null || String(toolArgs[reqField]).trim() === '') {
                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32602, message: `Missing required parameter: ${reqField}` },
                };
            }
        }
        try {
            const toolResult = await forwardToolCallToRemote(toolName, toolArgs);
            return { jsonrpc: '2.0', id, result: toolResult };
        } catch (err) {
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify({ error: String(err?.message || err) }) }],
                    isError: true,
                },
            };
        }
    }

    return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
    };
}

const isHttpMode = process.argv.includes('--http') || process.argv.includes('--standby') || process.env.MCP_TRANSPORT === 'http';

if (isHttpMode) {
    const port = Number(process.env.PORT || process.env.ACTOR_WEB_SERVER_PORT || 4321);
    const server = http.createServer(async (req, res) => {
        const urlPath = (req.url || '/').split('?')[0];
        if (req.method === 'GET' && (urlPath === '/' || urlPath === '/health')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    status: 'ok',
                    server: SERVER_NAME,
                    version: SERVER_VERSION,
                    remoteEndpoint: REMOTE_MCP_ENDPOINT,
                    storeUrl: STORE_URL,
                    tools: TOOLS.map((t) => t.name),
                })
            );
            return;
        }
        if (urlPath === '/mcp' && req.method === 'POST') {
            const chunks = [];
            for await (const ch of req) chunks.push(ch);
            let body;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }));
                return;
            }
            const out = await handleRpcMessage(body);
            if (!out) {
                res.writeHead(202);
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(out));
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    });
    server.listen(port, '0.0.0.0', () => {
        console.error(`[${SERVER_NAME}] HTTP MCP server listening on 0.0.0.0:${port}/mcp`);
    });
} else {
    const rl = readline.createInterface({
        input: process.stdin,
        terminal: false,
    });
    rl.on('line', async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            process.stdout.write(
                JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'
            );
            return;
        }
        if (Array.isArray(parsed)) {
            const responses = [];
            for (const item of parsed) {
                const r = await handleRpcMessage(item);
                if (r) responses.push(r);
            }
            if (responses.length > 0) {
                process.stdout.write(JSON.stringify(responses) + '\n');
            }
            return;
        }
        const resp = await handleRpcMessage(parsed);
        if (resp) {
            process.stdout.write(JSON.stringify(resp) + '\n');
        }
    });
}
