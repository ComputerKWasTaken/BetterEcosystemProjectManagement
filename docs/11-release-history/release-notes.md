# Release History

> Chronicle of AI Dungeon's major named releases and their key features.

## Overview

AI Dungeon releases are named updates that introduce significant new features, models, or changes. This document tracks the major releases and their contributions to the platform.

## Named Releases (Recent First)

### Frontier

**Status**: Latest release

The biggest model refresh in a while, bringing six new story models to AI Dungeon from Free through Ultimate, six new image models, and two new beta features in the model picker. Frontier also doubles down on cache-efficient context with the new "Optimized Context" setting, building on the Raven/Atlas experiment from the Aura release.

**Key Features**:

- **Six new story models** spanning every tier:
  - **DeepSeek V4 Flash** (284B / 13B) - First-ever DeepSeek model at the Free tier. Fast and conversational, great for dialogue-heavy scenes. 2K context on Free, 4K+ on premium, up to 128K context limit.
  - **DeepSeek V4 Pro** (1.6T / 49B) - Stands at the top of the lineup with over twice as many parameters as DeepSeek 3.2. Premium-tier flagship for maximum capability.
  - **Gemma 4 31B** - First Google model in AI Dungeon, launched in two flavors at Champion. Strong at instruction-following and steady prose, even with longer context.
  - **Equinox** (31B) - In-house finetune of Gemma 4 31B Instruct by Gryphe (creator of Wayfarer, Harbinger, Hearthfire). Balances Wayfarer 2's dark, consequence-driven adventures with Hearthfire's slice-of-life storytelling. Tuned for second-person scene continuation, character depth, and reduced refusals.
  - **Nova** (70B) - In-house finetune of Llama 3.3 70B, applying Muse's character-focused training techniques to a larger base for more consistent complex narratives.
  - **GLM 5.1** (754B / 40B) - Brings a different creative voice to the lineup, outside the DeepSeek and Gemma branches.
- **Six new image models** spanning every tier, letting players choose the look, quality, and credit cost that fits their adventure.
- **Two new beta features** in the model picker.
- **Optimized Context setting** (on by default for new Frontier models):
  - Reorders context for KV (key/value) caching so stable content comes first (instructions, Plot Essentials, Auto Summary, story history) and dynamic content comes last (Memory Bank, Story Cards, Author's Note, last action, front memory).
  - Supported models: Equinox, Gemma 4 31B, DeepSeek V4 Flash, DeepSeek V4 Pro, GLM 5.1. Atlas and Raven always optimize context (setting not available for them).
  - Prevents scripts from modifying the stable parts of the context, which effectively disables some popular scripts.
  - Allows context to overflow past the context length setting by up to 4K extra tokens before trimming back down, so trimming doesn't shift the front of the story and break the cache every turn.
  - Makes high-context stories cheaper to process, enabling longer context lengths at lower subscription tiers.

**Source**: https://latitude.io/news/frontier · https://aidungeon.com/frontier

---

### Aura

**Status**: Superseded by Frontier

Major update focused on model quality and memory. Made permanent the December experiments: doubled DeepSeek context, Dynamic Deep, and two new cached models.

**Key Features**:
- Doubled DeepSeek context
- Dynamic Deep model (rotates between DeepSeek 3.0/3.1/3.2)
- **Atlas** (671B / 37B) - Cache-efficient DeepSeek 3.2 variant with a new summary system, offering more context via KV caching
- **Raven** (357B / 32B) - Cache-efficient model paired with Atlas; both used a redesigned context layout that moved dynamic content (Story Cards) later in the context and blocked scripts from modifying the stable prefix. This experiment validated the cache-efficient context approach later productized as "Optimized Context" in Frontier.
- Doubled context for free players: Dynamic Small and Wayfarer Small increased from 2K to 4K tokens
- Completely redesigned Memory and Auto-Summarization system, rebuilt as two independent systems:
  - **Recent History** - Player's most recent actions included verbatim
  - **Memory Bank** - Fills gaps between recent history and story summary; retrieves specific past moments as high-fidelity flashbacks based on relevance
  - **Story Summary (Auto-Summarization)** - Now fed raw story text directly (not memory summaries), uses continual chunking so it never exceeds context limits

---

### Rise

Recent major update introducing platform improvements and new capabilities.

---

### Saga

Major update expanding storytelling capabilities and platform features.

---

### Gauntlet

**Key Features**:
- Wayfarer model improvements
- Enhanced instruction-following
- More coherent writing
- Default response length increased to 150

**Post-Gauntlet Fixes**:
- Wayfarer model hotfixes
- Mistral Small un-deprecated after feedback
- Community-driven adjustments

---

### Forge

**Key Features**:
- Four new text models:
  - Hermes 3 405B
  - Wayfarer
  - Madness
  - Dynamic Model
- Doubled context window size
- Expanded Hermes 3 70B access
- Four new AI image models:
  - FLUX.1 [pro]
  - FLUX.1 [dev]
  - FLUX.1 [schnell]
  - SDXL Lightning

---

### Ember

**Key Features**:
- Mistral Small model
- Hermes 3 70B model
- 30 new Quick Start prompts
- Enhanced model variety

---

### Pathfinder

**Key Features**:
- Pegasus model series:
  - Pegasus-8B (free tier)
  - Pegasus-8x7B (premium)
  - Pegasus-70B (Champion+ tier)
- Expanded Memory System for all players
- New hand-crafted original content scenarios

---

### Renaissance

**Key Features**:
- Advanced Settings opened to all players
- Previously premium-only generation parameters now accessible
- Democratized AI control

---

### Phoenix

**Key Features**:
- Scripting documentation moved to AI Dungeon Guidebook
- Platform consolidation
- Documentation improvements

---

### Unchained

Earlier major release with foundational platform updates.

---

## Release Pattern

AI Dungeon follows a named release pattern:
- Major updates get distinctive names
- Releases bundle multiple features
- Post-release patches address feedback
- Continuous improvement between major releases

## Model Evolution

Across releases, AI Dungeon has expanded model options:

**In-House Models**:
- Wayfarer series (12B, 70B)
- Pegasus series
- Muse, Nova, Hearthfire, Harbinger
- Madness, Atlas, Raven
- Equinox (31B, Gemma 4 finetune) - Frontier

**Third-Party Models**:
- Hermes 3 (70B, 405B)
- DeepSeek (V3, V3.2, V4 Flash, V4 Pro)
- Mistral variants
- Gemma 4 31B - Frontier (first Google model)
- GLM 5.1 - Frontier

## Memory System Evolution

The Memory System was introduced and expanded:
- Pathfinder: Memory System for all players
- Subsequent updates refined summarization
- Capacity increased across tiers
- Aura: Ground-up rebuild separating Auto-Summarization and Memory Bank into independent systems

## Context Length Expansion

Context limits have grown:
- Doubled in Forge update
- Higher tiers unlock larger contexts
- Up to 128K on select models
- Aura: Doubled context for free players (Dynamic Small / Wayfarer Small 2K -> 4K); doubled DeepSeek context
- Frontier: "Optimized Context" setting uses KV caching to offer up to 2x context on supported models without upgrading subscription; allows up to 4K overflow before trimming

## Scripting Evolution

Scripting has been refined:
- Phoenix: Documentation migration
- Ongoing API stability
- Community tools like aidungeon.js
- Frontier: "Optimized Context" prevents scripts from modifying the stable (cached) prefix of the context, effectively disabling some popular scripts on supported models

## Related Documentation

- [Latitude Philosophy](../00-foundation/latitude-philosophy.md)
- [Platform Overview](../00-foundation/platform-overview.md)

## Source References

- https://aidungeon.com/updates
- https://aidungeon.com/frontier
- https://latitude.io/news/frontier
- https://blog.latitude.io
