// Frontier Full Protocol Test Suite - AI Dungeon Output Modifier
// Paste this entire file into the scenario Output Modifier.
//
// Requires full-frontier-test-suite.library.js in the Library.
//
// Optional manual triggers:
//   Include "ff reset" or "[[ff:reset]]" in a prompt to reset the suite.
//   Include "ff duplicate" or "[[ff:duplicate]]" to force an extra duplicate
//   request-id check.

var modifier = function (text) {
  frontierPhase4Step(text);
  return { text: text };
};

modifier(text);
