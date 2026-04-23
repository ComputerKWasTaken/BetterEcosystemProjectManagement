// Frontier WebFetch Test Suite - AI Dungeon Output Modifier
// Pair with webfetch-test-suite.library.js.

var modifier = function (text) {
  frontierWebFetchStep(text);
  return { text: text };
};

modifier(text);
