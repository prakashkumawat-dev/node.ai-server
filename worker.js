import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import fs from "fs";
import pdf from "pdf-parse";
import IORedis from 'ioredis';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const connection = new IORedis({ maxRetriesPerRequest: null });

export const worker = new Worker('file-upload-queue', async (job) => {
    const _data = JSON.parse(job.data);
    console.log("👍👍", _data);

    const dataBuffer = fs.readFileSync(_data.path);
    pdf(dataBuffer).then(async function (data) {


        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 300,
            chunkOverlap: 10
        });

        const docs = [
            {
                pageContent: data.text,
                metadata: {
                    source: _data.path,
                    "pdf": {
                        "version": data.version,
                        "info": {
                            PDFFormatVersion: data.info?.PDFFormatVersion,
                            IsAcroFormPresent: data.info?.IsAcroFormPresent,
                            IsXFAPresent: data.info?.IsXFAPresent,
                            Producer: data.info?.Producer,
                            ModDate: data.info?.ModDate,
                        },
                        "metadata": null,
                        "totalpages": data.numpages
                    },
                    // apne job data se
                    filename: _data.filename,

                }
            }
        ];

        const allsplites = await splitter.splitDocuments(docs);

        // console.log("splites..👍👍 ",allsplites);
        // console.log(docs);

        try {
            const embeddings = new GoogleGenerativeAIEmbeddings({
                model: "text-embedding-004",
                apiKey: "AIzaSyDZFyVWCCxRwV780VWKZcj3u7gM7qGiXv0",
                taskType: "RETRIEVAL_DOCUMENT",
            });

            const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                url: 'http://localhost:6333',
                collectionName: "pdf-docs",
            });
            
            await vectorStore.addDocuments(allsplites);

            const result = await vectorStore.similaritySearch("what are agregate function in sql?");

            console.log(result[0]);

            console.log("all embedin data is stored in qdrantdb");

            const _return = "all embedin data is stored in qdrantdb";

            return _return;

        } catch (error) {

            console.log(error);

            return error;
        }
    });

}, {
    concurrency: 100, connection
});
