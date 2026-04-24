// Frontier Network Test Suite - AI Dungeon Output Modifier
// Pair with network-test-suite.library.js.

var modifier = function (text) {
  frontierNetworkStep(text);
  return { text: text };
};

modifier(text);
