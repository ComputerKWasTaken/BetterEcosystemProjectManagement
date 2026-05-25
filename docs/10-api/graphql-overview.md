# GraphQL API Overview

> AI Dungeon uses a GraphQL API for client-server communication, enabling programmatic access to platform features.

## Overview

AI Dungeon's backend exposes a GraphQL API that the web and mobile clients use. This same API can be accessed programmatically for automation, tooling, and integration purposes.

## What is GraphQL

GraphQL is a query language for APIs:
- Request exactly the data you need
- Single endpoint for all operations
- Strongly typed schema
- Queries (read) and Mutations (write)

## API Endpoint

The API is accessed via:
- HTTPS requests to AI Dungeon's GraphQL endpoint
- Authentication required for most operations
- JSON request/response format

## Authentication

Access requires authentication:
- Firebase authentication token
- Obtained from logged-in session
- Token included in request headers

The token can be extracted from browser DevTools (see aidungeon.js documentation for methods).

## Common Operations

### Queries (Reading Data)

- Fetch Adventures
- Get Scenario details
- Read Story Cards
- Access user information
- Load Adventure history

### Mutations (Writing Data)

- Create Adventures
- Update Scenarios
- Modify Story Cards
- Submit actions
- Update settings

## Schema Introspection

The API schema can be introspected:
- Query the schema for available types
- Discover fields and operations
- The introspection.json file (1.6MB) contains full schema

## Key Entities

The API works with these primary entities:
- **Adventures**: Individual playthroughs
- **Scenarios**: Templates for Adventures
- **Story Cards**: Triggered lore entries
- **Actions**: Story turns/inputs
- **Users**: Player accounts

See [API Entities](api-entities.md) for more detail.

## Rate Limiting

API access may be rate limited:
- Excessive requests may be throttled
- Follow reasonable usage patterns
- Automated tools should include delays

## Terms of Service

API usage is subject to AI Dungeon's terms:
- Don't abuse the API
- Respect content policies
- Don't circumvent authentication
- Use responsibly

## Use Cases

### Scenario Management

- Bulk edit Story Cards
- Sync scripts from local development
- Backup/restore scenarios

### Automation

- Automated testing of scenarios (use own model endpoints; ToS forbits on-site automation)
- Data extraction for analysis
- Integration with other tools

### Development Tools

- External editors
- Script development workflows
- CI/CD for scenario content

## Limitations

- No official public API documentation
- Authentication tokens expire
- API may change without notice
- Intended for platform clients, not third-party apps

## BetterDungeon Ultrascripts Write Path

BetterDungeon's Ultrascripts runtime writes its reserved `ultrascripts:*` story cards (heartbeat, state, response cards) by issuing a direct GraphQL mutation against AI Dungeon's production endpoint. The query is hardcoded in `BetterDungeon/services/ai-dungeon-service.js` and is authenticated with session credentials captured at runtime by the page-world `ws-interceptor.js` shim.

### Credentials capture (`baseCredentials`)

`ws-interceptor.js` runs at `document_start` in the MAIN world and shims `WebSocket`, `fetch`, and `XMLHttpRequest`. On the first successful GraphQL request of the page session it records:

```json
{
  "url": "<GraphQL endpoint>",
  "method": "POST",
  "headers": {
    "authorization": "Firebase <token>",
    "...": "other request headers"
  },
  "capturedAt": 1700000000000
}
```

That payload is forwarded once via `window.postMessage` to the isolated content-script world (`ws-stream.js`), which re-emits it as the `ultrascripts:baseCredentials:change` DOM event. The token is then re-applied to every Ultrascripts-owned write.

### Production mutation

Every Ultrascripts card write uses this exact production query:

- **Operation name:** `SaveQueueStoryCard`
- **Resolver field:** `updateStoryCard`
- **Variable input type:** `UpdateStoryCardInput!`

```graphql
mutation SaveQueueStoryCard($input: UpdateStoryCardInput!) {
  updateStoryCard(input: $input) {
    success
    message
    storyCard {
      id
      type
      title
      description
      keys
      value
      useForCharacterCreation
      updatedAt
      __typename
    }
    __typename
  }
}
```

Variables shape (see also `12-graphql-schema/input-objects/UpdateStoryCardInput.json`):

```json
{
  "input": {
    "id": "<storyCardId or null for create>",
    "type": "Ultrascripts",
    "title": "ultrascripts:heartbeat",
    "description": "",
    "keys": "",
    "value": "<JSON string>",
    "useForCharacterCreation": false
  }
}
```

The fetch is issued from the isolated world directly against the captured GraphQL endpoint with the captured `Authorization` header. There is no separate GraphQL client; the body is a plain `JSON.stringify({ operationName, variables, query })`.

### Deprecated: legacy snoop-and-replay template cache

Earlier BetterDungeon builds used a passive **mutation-template cache**: the MAIN-world shim would snoop outbound user-initiated card mutations to learn the query shape, store it in memory, and the isolated world would wait for that template before any write could go out. That model is now fully removed because it:

- could not write the turn-0 heartbeat (no manual card action meant no template was ever captured),
- silently failed in loops, and
- on mobile, cached a malformed fallback query (which incorrectly guessed the field `saveQueueStoryCard` and the input type `StoryCardInput`) as a "valid" template, because GraphQL validation errors return HTTP 200 OK. That trapped mobile in an infinite failure loop.

Do not reintroduce template caching, fallback query guessing, or any write path that depends on prior user-initiated mutation traffic. Always use the hardcoded `SaveQueueStoryCard` query above plus captured `baseCredentials`.

## Related Documentation

- [API Entities](api-entities.md)
- [Card Import/Export](../04-story-cards/card-import-export.md)
- [Ultrascripts Architecture](../../ultrascripts/01-architecture.md)

## Source References

- https://help.aidungeon.com/scripting
- `BetterDungeon/services/ai-dungeon-service.js` (`_replayMutation`, `upsertStoryCard`)
- `BetterDungeon/services/ultrascripts/ws-interceptor.js` (`updateBaseCredentials`)
- `BetterDungeon/services/ultrascripts/ws-stream.js` (`baseCredentials` handshake)
- `BetterDungeon/services/ultrascripts/core.js` (`runHeartbeat`)
