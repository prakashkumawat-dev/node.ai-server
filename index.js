import express from 'express';
import { Queue, QueueEvents } from 'bullmq';
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { callllm } from './llm.js';
const app = express();
dotenv.config();

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
app.use(express.json());
const queuename = 'file-upload-queue';
const connection = new IORedis({ maxRetriesPerRequest: null });


const queue = new Queue(queuename, { connection });
const queueevents = new QueueEvents(queuename, { connection });

const upload_dir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, upload_dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        console.log(file.fieldname, file.originalname);
        cb(null, `${uniqueSuffix} + '-' + ${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

app.use(cors());

app.get('/', (req, res) => {
    res.json({ status: 400 });
});

app.post('/chat', async (req, res) => {
    const userquery = req.body.message;
    console.log(userquery);
    if (!userquery) return;
    res.writeHead(200, {
        "connection": "keep-alive",
        "cache-control": "no-cache",
        "content-type": "text/event-stream"
    });

    try {
        await callllm(userquery, res);
        // res.write($result);
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }

    res.on("close", () => {
        // res.end();
        console.log("res ended!");
    });
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        const waith = await queue.add("ready-file", JSON.stringify({
            filename: req.file.originalname,
            destination: req.file.destination,
            path: req.file.path
        }));

        await waith.waitUntilFinished(queueevents);
        res.json({ message: "uploded" });
    } catch (error) {
        res.json({ error: error });
    }
});

app.listen('8000', () => {
    console.log('server running on http://localhost:8000');
});

