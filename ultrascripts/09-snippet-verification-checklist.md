# 09 - Snippet Verification Checklist

> Literal walkthrough checklist for manually verifying public Ultrascripts code snippets.

## How to use this

Work from top to bottom.

For each item, verify:

- copy/paste produces literal code
- logic matches the shipped runtime
- no functions are stored on serializable `state`
- turn timing is correct
- enhanced vs required posture is correct

Mark each item as you go:

- `[ ]` not checked yet
- `[x]` verified
- `[!]` needs cleanup

## Priority 1 - Real AI Dungeon script logic

These are the highest priority because they teach live scenario scripting
patterns people are likely to paste directly into AI Dungeon.

### Quick Start

- [x] [UltrascriptsQuickStartGuide.vue:211](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:211>) - SDK helper copy block
- [x] [UltrascriptsQuickStartGuide.vue:275](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:275>) - Enhanced fallback pattern
- [ ] [UltrascriptsQuickStartGuide.vue:318](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:318>) - Required guard pattern
- [ ] [UltrascriptsQuickStartGuide.vue:375](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:375>) - HP bar library snippet
- [ ] [UltrascriptsQuickStartGuide.vue:385](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:385>) - HP bar context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:418](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:418>) - Clock context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:469](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:469>) - AI Co-GM context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:525](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:525>) - Complete scenario library snippet
- [ ] [UltrascriptsQuickStartGuide.vue:536](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:536>) - Complete scenario context snippet

### Cookbook

- [ ] [UltrascriptsCookbookGuide.vue:45](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:45>) - Universal recipe shape
- [ ] [UltrascriptsCookbookGuide.vue:73](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:73>) - Recipe 1 library snippet
- [ ] [UltrascriptsCookbookGuide.vue:84](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:84>) - Recipe 1 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:111](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:111>) - Recipe 2 library snippet
- [ ] [UltrascriptsCookbookGuide.vue:130](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:130>) - Recipe 2 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:153](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:153>) - Recipe 3 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:182](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:182>) - Recipe 4 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:221](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:221>) - Recipe 5 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:273](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:273>) - Recipe 6 library snippet
- [ ] [UltrascriptsCookbookGuide.vue:284](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:284>) - Recipe 6 output snippet
- [ ] [UltrascriptsCookbookGuide.vue:332](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:332>) - Recipe 7 context snippet
- [ ] [UltrascriptsCookbookGuide.vue:371](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsCookbookGuide.vue:371>) - Recipe 8 context snippet

### Module guide recipes

- [ ] [UltrascriptsAiGuide.vue:383](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:383>) - AI request-side context snippet
- [ ] [UltrascriptsAiGuide.vue:411](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:411>) - AI input consume snippet
- [ ] [UltrascriptsAiGuide.vue:435](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:435>) - AI output snippet
- [ ] [UltrascriptsAiGuide.vue:476](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:476>) - AI library helper snippet
- [ ] [UltrascriptsClockGuide.vue:133](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsClockGuide.vue:133>) - Clock context snippet
- [ ] [UltrascriptsGeolocationGuide.vue:117](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsGeolocationGuide.vue:117>) - Geolocation regional awareness recipe
- [ ] [UltrascriptsNetworkGuide.vue:95](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsNetworkGuide.vue:95>) - Network context snippet
- [ ] [UltrascriptsScriptureGuide.vue:316](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:316>) - Scripture library snippet
- [ ] [UltrascriptsScriptureGuide.vue:371](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:371>) - Scripture context snippet
- [ ] [UltrascriptsScriptureGuide.vue:393](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:393>) - Scripture manifest override snippet A
- [ ] [UltrascriptsScriptureGuide.vue:415](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:415>) - Scripture manifest override snippet B
- [ ] [UltrascriptsScriptureGuide.vue:457](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:457>) - Scripture manifest snippet C
- [ ] [UltrascriptsScriptureGuide.vue:534](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:534>) - Scripture input snippet
- [ ] [UltrascriptsSystemGuide.vue:116](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSystemGuide.vue:116>) - System context snippet
- [ ] [UltrascriptsWeatherGuide.vue:141](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWeatherGuide.vue:141>) - Weather context snippet
- [ ] [UltrascriptsWebFetchGuide.vue:253](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:253>) - WebFetch context snippet
- [ ] [UltrascriptsWebFetchGuide.vue:286](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:286>) - WebFetch input snippet

## Priority 2 - Helper, payload, and contract snippets

These are not always pasted straight into AI Dungeon, but they define how
authors understand the runtime contract.

### SDK / helper contract

- [ ] [UltrascriptsSdkGuide.vue:282](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:282>) - SDK library helper snippet
- [ ] [UltrascriptsSdkGuide.vue:341](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:341>) - SDK creator bootstrap snippet
- [ ] [UltrascriptsSdkGuide.vue:396](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:396>) - SDK context snippet
- [ ] [UltrascriptsSdkGuide.vue:417](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:417>) - SDK generic ops helper snippet

### Payload / envelope examples

- [ ] [UltrascriptsAiGuide.vue:173](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:173>) - AI request args block A
- [ ] [UltrascriptsAiGuide.vue:186](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:186>) - AI request args block B
- [ ] [UltrascriptsAiGuide.vue:214](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:214>) - AI response format block A
- [ ] [UltrascriptsAiGuide.vue:238](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:238>) - AI response format block B
- [ ] [UltrascriptsAiGuide.vue:325](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAiGuide.vue:325>) - AI `ultrascripts:out` envelope example
- [ ] [UltrascriptsArchitectureGuide.vue:404](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:404>) - Architecture JSON block A
- [ ] [UltrascriptsArchitectureGuide.vue:465](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:465>) - Architecture JSON block B
- [ ] [UltrascriptsArchitectureGuide.vue:489](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:489>) - Architecture JSON block C
- [ ] [UltrascriptsScriptureGuide.vue:104](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:104>) - `ultrascripts:state:scripture` payload
- [ ] [UltrascriptsScriptureGuide.vue:502](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsScriptureGuide.vue:502>) - `ultrascripts:in:scripture` event payload
- [ ] [UltrascriptsWebFetchGuide.vue:199](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:199>) - WebFetch `ultrascripts:out` example

### Args / result-shape snippets

- [ ] [UltrascriptsClockGuide.vue:72](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsClockGuide.vue:72>) - `clock.now` args
- [ ] [UltrascriptsClockGuide.vue:92](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsClockGuide.vue:92>) - `clock.tz` args
- [ ] [UltrascriptsClockGuide.vue:111](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsClockGuide.vue:111>) - `clock.format` args
- [ ] [UltrascriptsGeolocationGuide.vue:77](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsGeolocationGuide.vue:77>) - `geolocation.permission` args
- [ ] [UltrascriptsGeolocationGuide.vue:89](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsGeolocationGuide.vue:89>) - `geolocation.getCurrent` args
- [ ] [UltrascriptsNetworkGuide.vue:71](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsNetworkGuide.vue:71>) - `network.status` args
- [ ] [UltrascriptsSdkGuide.vue:184](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:184>) - `sdk.version` result shape
- [ ] [UltrascriptsSdkGuide.vue:203](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSdkGuide.vue:203>) - `sdk.config` result shape
- [ ] [UltrascriptsSystemGuide.vue:69](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSystemGuide.vue:69>) - `system.info` args
- [ ] [UltrascriptsSystemGuide.vue:88](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsSystemGuide.vue:88>) - `system.power` args
- [ ] [UltrascriptsWeatherGuide.vue:76](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWeatherGuide.vue:76>) - `weather.current` args
- [ ] [UltrascriptsWeatherGuide.vue:102](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWeatherGuide.vue:102>) - `weather.forecast` args
- [ ] [UltrascriptsWebFetchGuide.vue:122](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:122>) - WebFetch args block A
- [ ] [UltrascriptsWebFetchGuide.vue:132](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:132>) - WebFetch args block B
- [ ] [UltrascriptsWebFetchGuide.vue:160](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:160>) - WebFetch args block C
- [ ] [UltrascriptsWebFetchGuide.vue:167](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsWebFetchGuide.vue:167>) - WebFetch args block D

## Priority 3 - Architecture / BetterDungeon-side authoring reference

These are lower priority for temporary manual verification because they are not
the main AI Dungeon author copy-paste path, but they still matter.

- [ ] [UltrascriptsArchitectureGuide.vue:164](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:164>) - GraphQL mutation example
- [ ] [UltrascriptsArchitectureGuide.vue:272](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:272>) - Transport flow block A
- [ ] [UltrascriptsArchitectureGuide.vue:285](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:285>) - Transport flow block B
- [ ] [UltrascriptsArchitectureGuide.vue:298](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:298>) - Transport flow block C
- [ ] [UltrascriptsArchitectureGuide.vue:310](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsArchitectureGuide.vue:310>) - Transport flow block D
- [ ] [UltrascriptsAuthoringGuide.vue:133](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAuthoringGuide.vue:133>) - `UltrascriptsModule` interface
- [ ] [UltrascriptsAuthoringGuide.vue:213](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAuthoringGuide.vue:213>) - `UltrascriptsContext` interface
- [ ] [UltrascriptsAuthoringGuide.vue:354](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAuthoringGuide.vue:354>) - Example state module
- [ ] [UltrascriptsAuthoringGuide.vue:425](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAuthoringGuide.vue:425>) - Example op
- [ ] [UltrascriptsAuthoringGuide.vue:511](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsAuthoringGuide.vue:511>) - Module registration snippet

## High-risk flags

Start with these if you want the shortest path to catching real issues:

- [ ] Quick Start SDK helper
- [ ] Quick Start required guard pattern
- [ ] Cookbook AI / WebFetch / structured output recipes
- [ ] SDK guide helper/bootstrap snippets
- [ ] Scripture payload + event snippets
- [ ] Geolocation regional awareness recipe
- [ ] Network context recipe

