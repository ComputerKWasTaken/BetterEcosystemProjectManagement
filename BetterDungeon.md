# BetterDungeon Project Management

> Project tracking and management for BetterDungeon development.

---

## 🚀 Roadmap / Future Plans

### Most Likely Happening
- **Automatic Model Selection** – A system that can automatically switch and select the best model for the player's needs, depending on their configuration.
- **Scenario/Adventure Folder Organization** - Group scenarios and adventures into collapsible folders. *(Difficult due to DOM virtualization)*
- **Story Card Tab Improvements** - Improves the Story Card tab within the Adventure page for better organization and categorization
- **Custom Themes** - Allows players to define and use their own custom themes on the adventure page.

### Considering
- **Ambient Background Noise** - Adds ambient background noise or ambient background music to the adventure page, for a more immersive experience. Similar to the feature present in Voyage.
- **Text-to-Speech** - Reformats the adventure text to ensure that screen reader softwares can properly read it out, which functions like a text-to-speech system.

### Long-Term Ideas
- 

---

## ✅ To-Do List

### Critical Priority
<!-- Must be done ASAP -->

### High Priority
<!-- Important, do soon -->
- ~~Create another folder inside of Project Management/Docs specifically for documenting and providing an example of the AI Dungeon DOM for future reference.~~ ✅ Done (13-DOM/ — Adventure page fully documented)
- ~~Revamp ai-dungeon-service.js to centralize selectors, fix navigation bugs, and add helper methods for features~~ ✅ Done (v2 — centralized SEL/MODES constants, element getters, input mode helpers, theme/sprite detection, generic tab navigation, waitFor utilities)

### Medium Priority
<!-- Standard priority -->

### Low Priority
<!-- Nice to have -->

---

## 🐛 Bugs & Issues

### v1.1.1 Notes
- In order to keep BetterDungeon bug free to allow for the further development of new features, I have gone through every single feature in BetterDungeon to compile all of the current bugs I've found.
- The goal is to get rid of them all to ensure v1.1.1 is bug free and ready to be published to the Chrome Store and the Firefox Store
- This will be the last update before v1.2.0, which will focus on new features and improvements

### Feature Functionality Checklist

This is a checklist of all of the features inside of BetterDungeon. All of my features have been retested with the latest revamp to the ai-dungeon-service.js file. Features without a checkmark have issues that need working on.

#### Input Modes Features
- [x] **Command Mode** - Works perfectly, no issues there. Only thing that should be changed is the emergency timeout feature (where if no interaction occurs, it resets the mode back to Story mode. This is an unnecessary safeguard that breaks the continuity illusion)
- [x] **Try Mode** - Try mode needs some work, urgently. It takes up the entirety of the Take a Turn input text box, preventing the user from typing anything in. However, the actual design of the Try mode success bar works, and the functionality is there. We just have to fix the UI issue, which isn't too much of a hassle. But in addition, just like Command mode, we have to remove the emergency timeout. (where if there is no interaction, it "times out" and resets the mode to the Do mode) Once again, this is unnecessary.

#### Gameplay Features
- [x] **Hotkeys** - Also works without a hitch. I've found no issues with the Hotkeys feature. Changing hotkeys and removing hotkeys also works the same. Very nice.
- [x] **Input History** - Also works great! The users can cycle through their previous inputs no problemo. Doesn't interfere with the Try mode either which is excellent :P
- [x] **Input Mode Colors** - Thankfully, the halo ring color around the action/story input box works perfectly, no issues there. Unfortunately, there are some minor issues with the buttons themselves.
- [x] **Adventure Notes** - No issues here either, it properly sets its location and state and can save/recall notes with no problem.

#### Formatting Features
- [x] **Markdown Formatting** - Markdown formatting itself works perfectly, but the feature where it automatically applies the instructions for formatting needs work. 

#### Scenario Building Features
- [x] **Trigger Highlighting** - Does work as intended, even including the feature that suggests potential story card triggers, but it suffers the same fate as the Markdown automatic apply system and Story Card scanner system. It appears that the ai-dungeon-service.js file is having issues with element references, causing the feature to not work properly.
- [x] **Story Card Analytics** - Also works as intended, but requires Story Cards to have been scanned previously (which fails because our ai-dungeon-service appears to be unable to find the necessary elements to scan). Once that is fixed, this feature should work perfectly, just like the Markdown automatic apply system, the Trigger Highlighting feature, and the Story Card scanner system.
- [x] **Story Card Modal Dock** - No issues here whatsoever. Works perfectly fine.
- [x] **BetterScripts** - Also no issues here. Wasn't changed at all in previous updates so there's no difference.

#### Automation Features
- [x] **Auto See** - Not a problem here. Works as intended.
- [x] **Auto Enable Scripts** - No issues here at all. Same as usual.

#### Preset Features
- [x] **Plot Presets** - No issues here. Works about as well as usual.
- [x] **Character Presets** - Same thing here. I already revised this feature so it makes sense.

#### My Thoughts
I think it's clear that the issues we are having are directly tied to CSS issues (failure to find elements, improper element placement) and the ai-dungeon-service.js file having trouble referencing the correct elements.
This makes sense, because AI Dungeon recently had a major framework overhaul, which would explain why our features that rely on specific element positions and references are failing.
This is great for us, because it means that the issues we need to solve are simple in nature and shouldn't take too long to fix.

### Critical
<!-- App-breaking, immediate fix required -->
- Try Mode Issues
    - The Try mode feature (the feature where we add a dice roll action mechanic as an input option) is messed up in its positioning. The element that displays the user's set Success chance seemingly replaces the text input box, making it impossible to edit the input, rendering the mode useless. We'll have to use what we know about the current AI Dungeon DOM to redefine where we place the element to ensure we don't block the input area.

### Major
<!-- Significant impact on functionality -->

### Minor
<!-- Small issues, low impact -->
- Markdown Formatting Issues
    - The automatic formatting instructions feature requires fixes. It tries to navigate to the Adventure tab but fails (same issue affects the Story Card scanner). The root cause is likely in ai-dungeon-service.js, since the same navigation failure occurs there. Oddly, opening the Settings panel works fine, so the problem is specific to Adventure tab navigation. This is probably due to recent AI Dungeon back-end updates that broke element references. (Story Card scanner has the same underlying issue)
    - **Update**: `ai-dungeon-service.js` revamp addresses this — `isSettingsPanelOpen()` was checking for a `"General"` tab that doesn't exist (the actual tab is `"Gameplay"`). Also added `[aria-label="Close settings"]` as a faster/more reliable panel detection method, a generic `selectTab()` with DOM re-find after click, and broadened `isTabSelected()` class checks. Navigation flows now use a shared `_navigateToSettingsTab()` helper. **Needs live testing.**

### Trivial
<!-- Cosmetic or negligible -->
- Input Mode Options Issues
    - The only trivial thing that I've noticed is the custom theme handling for the Input Mode switcher on the main AI Dungeon page. Since it uses sprites, the positioning of every element has to be adjusted manually. Unfortunately, this means that the Try button, the See button, and the Command button are all malformed, on both non-hover and hover states. 
    - The spacing of the sprites between each native button and custom button are porked (there's a slight visible gap on the left and right sides of the Try mode button, as an example.)
    - Switching back to the default theme after using a custom theme causes the custom button sprite designs to not properly be cleaned up, leaving the sprites on top of the buttons. This is removed if the input mode switcher is closed and reopened
    - In rare scenarios, the color of the Command input mode button is improperly set to yellow (like the Story mode highlight color) instead of its proper color
    - If the Command button is not present (manually toggled off), the See button still has its sprite modification applied, which causes it to not have the proper "end" segment sprite applied (as it's removed by us)

---

## Notes & Ideas

*Use this section for BetterDungeon-specific ideas and brainstorming.*

-
