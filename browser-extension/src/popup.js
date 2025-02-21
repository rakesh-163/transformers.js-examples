// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTIONS } from './constants.js';

// DOM Elements
const textInput = document.getElementById('text');
const embeddingOutput = document.getElementById('embedding-output');
const analyzeButton = document.getElementById('analyze-button');

// Helper to format embedding results
const formatEmbedding = (result) => {
  const { embedding, dimensions } = result;
  const preview = embedding.slice(0, 5).map(n => n.toFixed(4));
  return `Dimensions: ${dimensions.join('x')}\nFirst 5 values: [${preview.join(', ')}...]`;
};

// Function to generate embeddings
const generateEmbeddings = async (text) => {
  try {
    embeddingOutput.textContent = 'Calculating embeddings...';
    
    const response = await chrome.runtime.sendMessage({ 
      action: ACTIONS.EMBED, 
      text 
    });

    if (response.success) {
      embeddingOutput.textContent = formatEmbedding(response.data);
    } else {
      embeddingOutput.textContent = `Error: ${response.error}`;
    }
  } catch (error) {
    embeddingOutput.textContent = 'Failed to generate embeddings';
    console.error('Analysis error:', error);
  }
};

// Event Listeners
analyzeButton.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (text) {
    generateEmbeddings(text);
  }
});

textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = textInput.value.trim();
    if (text) {
      generateEmbeddings(text);
    }
  }
});
