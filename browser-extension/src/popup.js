// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTIONS } from './constants.js';

// DOM Elements
const textInput = document.getElementById('text');
const sentimentOutput = document.getElementById('sentiment-output');
const embeddingOutput = document.getElementById('embedding-output');
const analyzeButton = document.getElementById('analyze-button');

// Helper to format sentiment results
const formatSentiment = (result) => {
  const { label, score } = result[0];
  return `${label} (${(score * 100).toFixed(2)}%)`;
};

// Helper to format embedding results
const formatEmbedding = (result) => {
  const { embedding, dimensions } = result;
  const preview = embedding.slice(0, 5).map(n => n.toFixed(4));
  return `Dimensions: ${dimensions.join('x')}\nFirst 5 values: [${preview.join(', ')}...]`;
};

// Function to analyze text
const analyzeText = async (text) => {
  try {
    // Clear previous outputs
    sentimentOutput.textContent = 'Analyzing...';
    embeddingOutput.textContent = 'Calculating embeddings...';
    
    // Run both analyses in parallel
    const [sentimentResponse, embeddingResponse] = await Promise.all([
      chrome.runtime.sendMessage({ action: ACTIONS.CLASSIFY, text }),
      chrome.runtime.sendMessage({ action: ACTIONS.EMBED, text })
    ]);

    // Handle sentiment results
    if (sentimentResponse.success) {
      sentimentOutput.textContent = formatSentiment(sentimentResponse.data);
    } else {
      sentimentOutput.textContent = `Error: ${sentimentResponse.error}`;
    }

    // Handle embedding results
    if (embeddingResponse.success) {
      embeddingOutput.textContent = formatEmbedding(embeddingResponse.data);
    } else {
      embeddingOutput.textContent = `Error: ${embeddingResponse.error}`;
    }

  } catch (error) {
    sentimentOutput.textContent = 'Analysis failed';
    embeddingOutput.textContent = 'Analysis failed';
    console.error('Analysis error:', error);
  }
};

// Event Listeners
analyzeButton.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (text) {
    analyzeText(text);
  }
});

textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const text = textInput.value.trim();
    if (text) {
      analyzeText(text);
    }
  }
});
