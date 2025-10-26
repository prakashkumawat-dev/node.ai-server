import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { concat } from "@langchain/core/utils/stream";
import { addTool, multiplyTool, web_search, web_page_extracter } from './Tool.js';
import dotenv from 'dotenv';

dotenv.config();
let messages = [];

const parser = new StringOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `you are the helpful assistent to resolve the user querys.

        Whenever a user asks you a query that cannot be resolved using a tool, then if you can resolve that query without a tool, then do so.

        If the user asks you to create any type of application, then provide him the code of that particular application.

        always give output in Pretty format.

        use web_search tool for accuracy,latest,updated and if you do not know what user asking so always use web_search tool for resolving user query.

        do not provide sansless and uncorrect answer to user. if you are not sure that what is the given query answer so use web_search tool always.

        Sometimes, you need to call a tool, but instead of actually calling it, you just send a text output saying, "I’m calling the tool for you," and you forget to provide the arguments for that tool. So, don’t do that — always include the tool arguments whenever there’s a need to call a tool, and confirm it properly.
        `
    ],
    new MessagesPlaceholder("input"),

]);


const llmwithtools = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-pro",
    temperature: 0,
    maxRetries: 2
}).bindTools([multiplyTool, addTool, web_search, web_page_extracter]);

const toolsByName = {
    add: addTool,
    multiply: multiplyTool,
    web_search: web_search,
    web_page_extracter: web_page_extracter
};

async function ToolLoop(output) {
    if (!output.tool_calls) return output;

    try {
        for await (const toolCall of output.tool_calls) {
            const selected_tool = toolsByName[toolCall.name];

            if (selected_tool) {
                const result = await selected_tool.invoke(toolCall.args);

                messages.push(new ToolMessage({ content: result, name: toolCall.name }));
            }
        };
        return "succses";

    } catch (error) {
        return error;
    }

};

const chain = prompt.pipe(llmwithtools);

export const callllm = async (inputprompt, res) => {
    messages.push(new HumanMessage(inputprompt));
    _callthis();

    async function _callthis() {
        try {
            let output = await chain.stream({ input: messages });
            let gathered = undefined;

            // for of loop for streaming
            for await (const chunk of output) {
                gathered = gathered !== undefined ? concat(gathered, chunk) : chunk
                if (chunk.tool_call_chunks.length > 0) {
                    console.log("👽", gathered.tool_call_chunks);
                } else {
                    if (typeof chunk.content == "string" && chunk.content.trim()) {
                        res.write('data: ' + JSON.stringify({ data: chunk.content }) + '\n\n');
                        console.log("✨", chunk.content);
                    }
                }
            }
            // push AI messages into messages array
            console.log("gather tool call \n", gathered);
            messages.push(new AIMessage(gathered));

            if (!gathered.tool_calls.length > 0) {
                res.end();
            }
            else {
                res.write('data: ' + JSON.stringify({ Toolcall: gathered.tool_calls }) + '\n\n');
                await ToolLoop(gathered);
                _callthis();
            }

        } catch (error) {
            console.error("❌Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
};


