// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline } from "@huggingface/transformers";

import { CONTEXT_MENU_ITEM_ID } from "./constants.js";
import { ACTIONS } from './constants.js';
import { TEST_WORDS } from './utils.js';
import { cosineSimilarity } from './utils.js';

/**
 * Singleton class to manage the embedding model
 */
class EmbedderSingleton {
  static async getInstance(progress_callback) {
    return (this.fn ??= async (...args) => {
      this.instance ??= pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          progress_callback,
          device: "webgpu",
        },
      );

      return (this.promise_chain = (
        this.promise_chain ?? Promise.resolve()
      ).then(async () => (await this.instance)(...args)));
    });
  }
}

// Create separate functions for classification and embedding
const classify = async (text) => {
  const classifier = await ClassifierSingleton.getInstance((data) => {
    // You can track the progress of the pipeline creation here.
    // e.g., you can send `data` back to the UI to indicate a progress bar
    // console.log(data)
  });

  const result = await classifier(text);
  return result;
};

const embed = async (text) => {
  const embedder = await EmbedderSingleton.getInstance((data) => {
    // Progress tracking for embedder
  });

  // Get embedding for input text
  const inputEmbedding = await embedder(text, { pooling: 'mean', normalize: true });
  
  // Get embeddings for all test words
  const testEmbeddings = await Promise.all(
    TEST_WORDS.map(word => 
      embedder(word, { pooling: 'mean', normalize: true })
    )
  );

  // Calculate similarities
  const similarities = testEmbeddings.map((embedding, index) => ({
    word: TEST_WORDS[index],
    similarity: cosineSimilarity(
      Array.from(inputEmbedding.data),
      Array.from(embedding.data)
    )
  }));

  // Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity);

  return {
    mostSimilar: similarities[0],
    allSimilarities: similarities
  };
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
  // Register a context menu item that will only show up for selection text.
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Classify "%s"',
    contexts: ["selection"],
  });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ignore context menu clicks that are not for classifications (or when there is no input)
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID || !info.selectionText) return;

  // Perform classification on the selected text
  const result = await classify(info.selectionText);

  // Do something with the result
  chrome.scripting.executeScript({
    target: { tabId: tab.id }, // Run in the tab that the user clicked in
    args: [result], // The arguments to pass to the function
    function: (result) => {
      // The function to run
      // NOTE: This function is run in the context of the web page, meaning that `document` is available.
      console.log("result", result);
      console.log("document", document);
    },
  });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
//
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async function () {
    try {
      if (message.action === ACTIONS.EMBED) {
        const result = await embed(message.text);
        sendResponse({ success: true, data: result });
      } else {
        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
      }
    } catch (error) {
      console.error('Error in background script:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Indicates async response
});
//////////////////////////////////////////////////////////////
