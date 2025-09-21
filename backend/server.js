// server.js
// Simple backend for OCR + AI analysis

require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors');
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
// Google Cloud libraries
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");
const { VertexAI } = require("@google-cloud/vertexai");

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Multer setup for file upload
const upload = multer({ dest: "uploads/" });

// Tell Google where our key file is
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "../gcloud-key.json");

// === Document AI setup ===
const projectId = "legal-doc-scanner";   // <-- replace with your GCP project ID
const location = "us";                 // try "us" first
const processorId = "4443a50736b68285"; // <-- we'll set this up soon
const documentaiClient = new DocumentProcessorServiceClient({
    // Explicitly set the endpoint for the Document AI client
    apiEndpoint: `${location}-documentai.googleapis.com`,
});

// === Vertex AI setup ===
// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: projectId, location: "us-east4" });

// Instantiate the model
const generativeModel = vertex_ai.getGenerativeModel({
  model: "gemini-2.0-flash-lite-001",
  generationConfig: {
    responseMimeType: "application/json",
  },
});
// // === ROUTES ===

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Upload + analyze route
app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    // 1. Send file to Document AI OCR
    const fileBytes = await fs.readFile(req.file.path);

    const [result] = await documentaiClient.processDocument({
      name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
      rawDocument: {
        content: fileBytes.toString("base64"),
        mimeType: "application/pdf", // or image/png, image/jpeg
      },
    });

    const text = result.document.text;

    // 2. Ask Vertex AI to summarize & flag risks
    const prompt = `
You are a legal assistant. Analyze the following contract text.

Return ONLY valid JSON in this exact format, with no extra words:

{
  "summary": "3-4 sentence plain English summary of the contract",
  "red_flags": [
    {
      "issue": "string",
      "snippet": "string (short text from contract)",
      "severity": "low|medium|high",
      "suggestion": "string"
    }
  ]
}

Contract text:
${text}
`;


    const generateContentRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const resultFromGemini = await generativeModel.generateContent(generateContentRequest);
    const responseFromGemini = resultFromGemini.response;

    let analysis;
    try {
      const rawOutput = responseFromGemini.candidates[0].content.parts[0].text;
      console.log("Gemini Raw Output for parsing:", rawOutput); // For debugging
      
      // Since responseMimeType is 'application/json', the output should be a valid JSON string.
      // It might still be wrapped in markdown, so we'll clean it just in case.
      const cleanedJsonString = rawOutput.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleanedJsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      const rawOutput = responseFromGemini.candidates?.[0]?.content?.parts?.[0]?.text || "No output from AI.";
      // Send a structured error back to the frontend
      return res.status(500).json({ error: "Failed to parse AI response.", raw: rawOutput });
    }

    res.json({ rawText: text, analysis: analysis });
  } catch (err) {
    // --- Improved Error Logging ---
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx (e.g., 400, 500)
      console.error("API Error Response:", JSON.stringify(err.response.data, null, 2));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error making API request:", err.message);
    }
    res.status(500).json({ error: "An internal server error occurred.", message: err.message });
  } finally {
    // 3. Clean up the uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded file:", cleanupError.message);
      }
    }
  }
});

// Follow-up question route
app.post("/ask", async (req, res) => {
  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: "Question and context are required." });
  }

  try {
    const prompt = `
      Based on the following legal document text, please answer the user's question.
      Provide a clear and concise answer.

      ---DOCUMENT TEXT---
      ${context}
      ---END DOCUMENT TEXT---

      USER'S QUESTION: "${question}"

      Answer:
    `;

    const generateContentRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const resultFromGemini = await generativeModel.generateContent(generateContentRequest);
    const responseFromGemini = resultFromGemini.response;
    const answer = responseFromGemini.candidates[0].content.parts[0].text;

    res.json({ answer });

  } catch (err) {
    console.error("Error in /ask route:", err.message);
    res.status(500).json({ error: "An internal server error occurred while answering the question.", message: err.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
