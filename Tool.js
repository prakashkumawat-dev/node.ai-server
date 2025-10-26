import { tool } from '@langchain/core/tools'
import * as z from "zod";
import { TavilySearch, TavilyExtract } from '@langchain/tavily';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import dotenv from 'dotenv';
// import { loadSummarizationChain } from "langchain/chains";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";



dotenv.config();
const TAVILY_API_KEY = process.env.TAVILY_API_KEY

export const addTool = tool(
    async ({ a, b }) => {
        return a + b;
    },
    {
        name: "add",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
        description: "Adds a and b.",
    }
);

export const multiplyTool = tool(
    async ({ a, b }) => {
        return a * b;
    },
    {
        name: "multiply",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
        description: "Multiplies a and b.",
    }
);

export const web_search = tool(
    async (query) => {
        console.log("⚒️", query);
        const _tool = new TavilySearch({
            tavilyApiKey: TAVILY_API_KEY,
            topic: query.topic,
            maxResults: 5,
            includeImages: true,
        });
        const result = await _tool.invoke({
            query: query.query
        });
        console.log("result of web_search tool", result);
        return result;
    },
    {
        name: "web_search",
        schema: z.object({
            query: z.string().describe("the query for web searching"),
            topic: z.enum(["finance", "news", "general"]).describe("these are query topics each one choose according query")
        }),
        description: "this tool provides the web searching for updated , latest things and data accuracy like weather updates, latest news , devlopers docs etc and more. It provides accurate and up-to-date facts from trusted web sources. use me for searching latest docs versions, docs reading task."
    }
);

export const youtube_transcript = tool(
    async (url) => {
        const loader = YoutubeLoader.createFromUrl(url.url, {
            language: "en",
            addVideoInfo: true,
        });

        const docs = await loader.load();
        console.log(docs);
    },
    {
        name: "youtube_transcript",
        schema: z.object({
            url: z.string().describe("the video url for youtube transcript")
        }),
        description: "This tool takes a YouTube video link, automatically extracts the video content and give transcript. and then llm can pick the transcript and can summariz"
    }
);

export const web_page_extracter = tool(
    async ({ url }) => {
        const tavily_extractor = new TavilyExtract({
            tavilyApiKey: TAVILY_API_KEY,
            extractDepth: "basic",
            includeImages: true
        });
        console.log("urls", url)
        const result = await tavily_extractor.invoke({ urls: url });
        console.log("✨", result);
        return result;
    },
    {
        name: "web_page_extracter",
        schema: z.object({
            url: z.array(z.string()).describe("one or more valid webpage URLs (max 20)")
        }),
        description: "this tool takes url's of webpage and parse the content of url then give the content. i am usefull for reading webpages."
    }
);
