// Frontier Clock Test Suite - AI Dungeon Output Modifier
// Pair with clock-test-suite.library.js.

var modifier = function (text) {
  frontierClockStep(text);
  return { text: text };
};

modifier(text);
