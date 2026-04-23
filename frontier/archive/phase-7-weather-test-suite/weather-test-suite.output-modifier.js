// Frontier Weather Test Suite - AI Dungeon Output Modifier
// Pair with weather-test-suite.library.js.

var modifier = function (text) {
  frontierWeatherStep(text);
  return { text: text };
};

modifier(text);
