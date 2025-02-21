// Compute cosine similarity between two vectors
export const cosineSimilarity = (vec1, vec2) => {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (mag1 * mag2);
};

export const TEST_WORDS = ['human', 'vegetable', 'fruit', 'vehicle', 'planet']; 