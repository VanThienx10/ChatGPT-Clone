# ChatGPT Clone (Groq + SerpAPI) 

A ChatGPT-style AI Chat Application built with Groq SDK and SerpAPI.
It uses the open-source GPT model “openai/gpt-oss-120b” via Groq for intelligent conversation handling, combined with real-time web search powered by SerpAPI, enabling the assistant to deliver accurate and up-to-date answers on current or niche topics.


## Features

The application has following features:

- Conversational AI using the open-source GPT-120B model
- Real-time Web Search integration via SerpAPI
- Tool Calling Mechanism that performs an automatic search when knowledge is insufficient


## Getting Started

1. Clone this repository to your local machine:
   ```shell
   git clone https://github.com/harrismalik98/ChatGPT-Clone.git
   ```
2. Install the dependencies:
   ```shell
   cd ChatGPT-Clone
   npm install
   ```
3. Configure environment variables by creating a `.env` file in the project root:
   ```shell
   GROQ_API_KEY=
   SERP_API_KEY=
   ```
4. Start the development server:
   ```shell
   npm run dev
   ```
5. Access the application in your web browser at http://localhost:3000


## Technologies Used

The ChatGPT Clone is a full-stack web application built with the following modern tools and technologies:

- **Next.js 15:** A powerful React framework for building fast, scalable, and SEO-friendly web applications with server-side rendering and API routes.

- **TailwindCSS:** A utility-first CSS framework for creating beautiful and responsive user interfaces.

- **ShadcnUI:** A beautifully designed and customizable component library used to enhance the aesthetics and user experience of the website.