// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTIONS } from './constants.js';

// DOM Elements
const textInput = document.getElementById('text');
const embeddingOutput = document.getElementById('embedding-output');
const analyzeButton = document.getElementById('analyze-button');

// Helper to format similarity results
const formatSimilarities = (result) => {
  const { mostSimilar, allSimilarities } = result;
  
  const header = `Most similar word: "${mostSimilar.word}" (${mostSimilar.similarity.toFixed(4)})\n\nAll similarities:`;
  
  const similarities = allSimilarities
    .map(({ word, similarity }) => `${word}: ${similarity.toFixed(4)}`)
    .join('\n');
    
  return `${header}\n${similarities}`;
};

// Function to generate embeddings
const generateEmbeddings = async (text) => {
  try {
    embeddingOutput.textContent = 'Calculating similarities...';
    
    const response = await chrome.runtime.sendMessage({ 
      action: ACTIONS.EMBED, 
      text 
    });

    if (response.success) {
      embeddingOutput.textContent = formatSimilarities(response.data);
    } else {
      embeddingOutput.textContent = `Error: ${response.error}`;
    }
  } catch (error) {
    embeddingOutput.textContent = 'Failed to generate similarities';
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
