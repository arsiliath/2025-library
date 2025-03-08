# 2025-01-28 Image Classification

This project is a cross-platform image classification tool built with Node.js. Follow the steps below to get up and running on any platform.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or later)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/arsiliath/2025-library
   cd 2025-library
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

## Usage


### Scenario 1: Images already classified

If you already have images and a data.json in your project:

1. **Start the server:**

   ```bash
   npm start
   ```

2. **View in Browser:**

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

### Scenario 2: Images not classified

If you need to add images and run classification

1. **Configure the API Key:**

   - Create a \`.env\` file in the project root.
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-pr...
     ```

2. **Add Your Images:**

   - Place your image files in the \`images/\` directory. Images can be organized in subfolders if needed.

3. **Run Data Preparation Scripts:**

   - **Research the images:**
     ```bash
     npm run research
     ```
   - **Compute TF-IDF for improved similarity detection:**
     ```bash
     npm run tfidf
     ```

4. **Optional Maintenance Scripts:**

   - **Prune:** Remove entries that do not have a matching image file.
     ```bash
     npm run prune
     ```
   - **Duplicates:** Identify duplicate images.
     ```bash
     npm run duplicates
     ```
   - **Rename:** Adjust image file names (e.g., prepend a folder name) if needed.
     ```bash
     npm run rename
     ```
   - **Duplicates (again):** Re-run duplicates removal if changes were made.
     ```bash
     npm run duplicates
     ```

5. **Start the Server:**

   After processing, start the server to view your images:
   ```bash
   npm start
   ```
   Then open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## License

All rights reserved.

## Credits

For AI acknowledgements, please see [AI.md](AI.md).
