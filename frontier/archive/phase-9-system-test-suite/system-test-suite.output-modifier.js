// Frontier System Test Suite - AI Dungeon Output Modifier
// Pair with system-test-suite.library.js.

var modifier = function (text) {
  frontierSystemStep(text);
  return { text: text };
};

modifier(text);
