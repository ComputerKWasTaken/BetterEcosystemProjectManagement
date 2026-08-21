# Scripting API Reference

> Complete API reference for AI Dungeon scripting based on ScriptingTypes.js.

## Global Variables

### text

**Type**: `string`

**Description**: The primary text for the current hook

**By Hook**:
- onInput: Player's input text
- onModelContext: Assembled context
- onOutput: AI's generated response

**Return**: Must be returned in the return object

---

### stop

**Type**: `boolean`

**Description**: Flag to halt generation pipeline

**Default**: `false` / `undefined`

**Effect**: Prevents AI generation when `true`

---

### state

**Type**: `Object`

**Structure**:
```javascript
{
  memory: {
    context: string,      // Plot Essentials value; writes through to UI
    authorsNote: string,  // Author's Note value; writes through to UI
    frontMemory: string   // End-of-context injection
  },
  message: string,        // Player-visible message
  [key: string]: any      // Custom properties
}
```

**Persistence**: Survives across turns

---

### memory

**Type**: `Object`

**Structure**:
```javascript
{
  context: string,        // UI Plot Essentials
  [key: string]: any
}
```

**Synchronization**: Assigning `state.memory.context` overwrites the visible UI
Plot Essentials value; it is not a separate higher-priority layer. This field
cannot be edited while Optimized Context is active. The other two fields,
`state.memory.authorsNote` and `state.memory.frontMemory`, remain writable.

---

### info

**Type**: `Object` (read-only)

**Properties**:

| Property | Type | Hook | Description |
|----------|------|------|-------------|
| actionCount | number | All | Total actions |
| characters | array | All | Player names |
| maxChars | number | onModelContext | Max context chars |
| memoryLength | number | onModelContext | Memory char count |
| useCacheEfficient | boolean | onModelContext | Whether Optimized Context is active |

---

### history

**Type**: `Array<Action>`

**Action Object**:
```javascript
{
  text: string,
  type: 'start' | 'continue' | 'do' | 'say' | 'story' | 'see' | 'repeat' | 'unknown',
  rawText: string  // Deprecated, same as text
}
```

**Order**: Chronological (oldest first)

---

### storyCards

**Type**: `Array<StoryCard>`

**StoryCard Object**:
```javascript
{
  id: string,
  title: string,              // Name field
  keys: string,               // Triggers field
  type: string,               // Type field
  entry: string,              // Entry field
  description: string,        // Notes field
  createdAt: string,
  updatedAt: string,
  useForCharacterCreation: boolean
}
```

---

## Global Functions

### addStoryCard(keys, entry, type?)

Creates a new Story Card.

**Parameters**:
- `keys` (string): Triggers (also sets title)
- `entry` (string): Content
- `type` (string, optional): Card type, default "Custom"

**Returns**: `number` (new array length) or `false` if duplicate

**Legacy Alias**: `addWorldEntry(keys, entry)`

---

### updateStoryCard(index, keys, entry, type)

Updates an existing Story Card.

**Parameters**:
- `index` (number|string): Array index
- `keys` (string): New triggers
- `entry` (string): New content
- `type` (string): New type

**Returns**: `void`

**Throws**: Error if card doesn't exist

**Legacy Alias**: `updateWorldEntry(index, keys, entry)`

---

### removeStoryCard(index)

Removes a Story Card.

**Parameters**:
- `index` (number|string): Array index

**Returns**: `void`

**Throws**: Error if card doesn't exist

**Legacy Alias**: `removeWorldEntry(index)`

---

### log(...data)

Logs to console.

**Parameters**: Any values

**Returns**: `void`

**Aliases**: `console.log()`, `sandboxConsole.log()`

---

## Hooks

### onInput (Input Modifier)

**When**: After player input, before context assembly

**Available**: `text`, `state`, `info`, `history`, `storyCards`, `memory`, `stop`

**Return**: `{ text, stop? }`

---

### onModelContext (Context Modifier)

**When**: After context assembly, before AI

**Available**: All above + `info.maxChars`, `info.memoryLength`,
`info.useCacheEfficient`

**Return**: `{ text, stop? }`

**Optimized Context**: To change Context text, begin the hook with
`// @cache-compatible`, return the complete original text unchanged at the
start, and append only a suffix. Without the annotation, changes are discarded
and the player is notified. Invalid prepend, replacement, deletion, reorder, or
truncation changes are also discarded. This annotation does not permit writes
to `state.memory.context`.

---

### onOutput (Output Modifier)

**When**: After AI generation, before display

**Available**: `text`, `state`, `info`, `history`, `storyCards`, `memory`

**Return**: `{ text }`

---

## Return Object

All hooks must return an object:

```javascript
return { text };                    // Pass through
return { text: modifiedText };      // Modify
return { text, stop: true };        // Halt (onInput/onModelContext)
return { text: null, stop: true };  // Command processed
```

---

## Empty Text Behavior

| Hook | Empty Text Result |
|------|-------------------|
| onInput | "Unable to run scenario scripts" error |
| onModelContext | Uses original context |
| onOutput | "Script failed" error |

---

## Related Documentation

- [Hooks Overview](../01-scripting/api/hooks-overview.md)
- [Global Objects Reference](../01-scripting/reference/global-objects.md)
- [Quick Reference](quick-reference.md)
