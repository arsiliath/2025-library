# AI Acknowledgment and Citation

I acknowledge the use of **ChatGPT (GPT-4o)** (https://chat.openai.com/) to assist in the **design, implementation, and refinement of this project's codebase**.

## 1. AI System Used
- **ChatGPT (GPT-4o) via OpenAI API**: (https://platform.openai.com/)

## 2. Specific Use of AI
ChatGPT was used to **assist in writing, debugging, and optimizing the code** for:
- **Automated image metadata extraction** using OpenAI's vision capabilities.
- **Reverse indexing for search functionality** to efficiently match images with queries.
- **Parallel processing of API requests** to speed up image analysis.
- **Improving search relevance** using **stemming (`natural` library)** and **fuzzy matching (`fuzzball` library)**.
- **Refactoring and optimizing server-side logic** in Express.js.
- **Implementing front-end infinite scroll behavior** in JavaScript.

## 3. Prompts Used
The following example prompts were used throughout development:

- **For designing the search system:**
  ```plaintext
  How can I implement a reverse index in JavaScript to allow fast keyword-based searching over JSON metadata?
  ```
  
- **For optimizing API request batching:**
  ```plaintext
  Given that OpenAI has rate limits, how can I efficiently batch API calls while maintaining high concurrency?
  ```

- ** For improving fuzzy search:
  ```plaintext
  I need my search to match "Japan" and "Japanese". Can I use `natural` or `fuzzball` in Node.js to handle this?
  ```

- ** For documentation
  ```plaintext
  /doc (in copilot)
  ```

- ** For readme
  ```plaintext
  write a cross platform readme.md for a project with this package json...
  ```
## 4. How the Output Was Used
- AI-generated **code snippets were reviewed, modified, and integrated** into the final codebase.
- The AI was used iteratively for **troubleshooting, optimizing performance, and refining logic**.
- **Final implementations** include a mix of AI-assisted suggestions and manual modifications to ensure project goals are met.
- Documenting the code
- Writing a readme





