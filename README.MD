This is an AI server project that uses various LangChain components and other AI services to provide powerful AI capabilities.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version v23.6.1)
- npm (comes with Node.js)
- Docker and Docker Compose (for running services locally)

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/prakashkumawat-dev/node.ai-server.git
cd server
```

2. Install dependencies:
```bash
npm install or npm i
```

3. Environment Setup:
- Create a `.env` file in the root directory
- Add necessary API keys and configurations:-
  - tavily api key
  - gemeni api key

## Available Scripts

- Start development server with:-
1. run docker compose:-
```bash
docker compose up -d
```
2. then run server:-
```
node index.js  or  nodemon index.js
```

## License

This project is licensed under the ISC License.