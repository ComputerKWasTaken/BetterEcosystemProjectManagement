// Frontier Scripture Test Suite - AI Dungeon Output Modifier
// Paste this entire file into the scenario Output Modifier.
//
// Requires scripture-test-suite.library.js in the Library.
//
// Optional manual triggers:
//   Include "scr sanitize" or "[[scr:sanitize]]" in a prompt to publish a
//   malicious custom-widget fixture on the next output.
//   Include "scr reset" or "[[scr:reset]]" to publish a manifest variant that
//   removes colors, variants, icon sizes, titles, and styles.
//   Include "scr malformed" or "[[scr:malformed]]" to intentionally corrupt
//   frontier:state:scripture once. The next normal output should recover.

var modifier = function (text) {
  frontierSuiteStep(text);
  return { text: text };
};

modifier(text);
