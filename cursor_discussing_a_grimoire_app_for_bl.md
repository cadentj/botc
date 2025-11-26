# Discussing a grimoire app for blood on the clocktower
_Exported on 11/25/2025 at 20:03:33 CST from Cursor (2.1.34)_

---

**User**

please help me make a simple grimoire app for blood on the clocktower



are you familiar with that game, specifically the trouble brewing expansion?



don't write any code or a plan just yet, lets just chat

---

**Cursor**

Yes, I'm quite familiar with Blood on the Clocktower! It's a fantastic social deduction game, and Trouble Brewing is the introductory script that comes with the base game.

**The basics:**
- It's a hidden role game where the Demon team (evil) tries to kill off the Townsfolk while the good team tries to identify and execute the Demon
- Unlike Werewolf/Mafia, dead players stay engaged and can still vote (though they only get one final vote token)
- The Storyteller has much more flexibility to adjust the game flow

**Trouble Brewing specifically** has a nice balanced roster:

**Townsfolk (good):** Washerwoman, Librarian, Investigator, Chef, Empath, Fortune Teller, Undertaker, Monk, Ravenkeeper, Virgin, Slayer, Soldier, Mayor

**Outsiders (good but with drawbacks):** Butler, Drunk, Recluse, Saint

**Minions (evil):** Poisoner, Spy, Scarlet Woman, Baron

**Demon:** Imp (can kill at night, and if it kills itself, a Minion becomes the new Imp)

A **grimoire** is what the Storyteller uses to track:
- Which players have which roles
- Who's alive/dead
- Reminder tokens (poisoned, protected, etc.)
- Night order
- Other game state

Is that the direction you're thinking—a digital grimoire for the Storyteller? Or something else like a player reference app? Happy to discuss what features would be most useful!

---

**User**

actually...creeping scope a bit. an entire botc experience that you can play with friends. it assumes that players will have phones, and the storyteller will have a laptop.



here's how it should work at a high level: 

- the storyteller will create a lobby on their pc and give a code to players

- the players will enter the code on their phone to join a lobby, as well as their in game name

- once the storyteller starts the game, players will recieve their role

- on their phone, players can see their role and a character sheet.

- they can also see a simple state of the game: e.g. all the players and whether they're alive or dead

- on the pc with the grimoire, the storyteller can keep track of the game state and has the rules available to them as well



curious what you think about this? i'm thinking i'd need to set up a fly.io server with websocket connections for the game lobby. i'll probably run a vite app on vercel. will use hono for the backend. anything i might be missing with the game setup? Please think carefully about that. when i say think carefully, you should (1) list out everything you know about trouble brewing. in detail -- exactly what happens each night, and the affordances that might be useful for players. (2) then for each thing, think about whether i already mentioned something for that, or whether a new affordance should be build. finally, (3) explain carefully how the infra should be set up for this app

---

**Cursor**

This is a great project! Let me think through this systematically.

---

## Part 1: Everything About Trouble Brewing

### Setup Phase
- **Player count:** 5-20 (Trouble Brewing typically 7-15)
- **Role distribution formula:** Scales with player count. E.g., 7 players = 5 Townsfolk, 0 Outsiders, 1 Minion, 1 Demon. Baron adds +2 Outsiders.
- **Evil team info:** At start, Minions and Demon wake together and learn who each other are. Demon also sees **3 not-in-play characters** as safe bluffs.
- **Drunk setup:** One Townsfolk token is secretly the Drunk—they see a Townsfolk role but are actually the Drunk.

### First Night (special)
Order matters! Roughly:
1. **Poisoner** → chooses a player to poison (their ability malfunctions tonight + tomorrow)
2. **Washerwoman** → learns "Player A or B is the [Townsfolk]" (one-time)
3. **Librarian** → learns "Player A or B is the [Outsider]" or "no Outsiders" (one-time)
4. **Investigator** → learns "Player A or B is the [Minion]" (one-time)
5. **Chef** → learns number of evil pairs sitting adjacent (one-time)
6. **Empath** → learns how many alive neighbors are evil (recurring)
7. **Fortune Teller** → picks 2 players, learns if either is the Demon (recurring, has a "red herring" who always pings positive)
8. **Butler** → picks their "master" for tomorrow (recurring)
9. **Spy** → sees the entire Grimoire (recurring)

**No kills on night 1** (Imp doesn't act).

### Subsequent Nights
1. **Poisoner** → poisons someone
2. **Monk** → protects someone (not self) from demon kill
3. **Spy** → sees Grimoire
4. **Imp** → kills someone (unless Soldier, or Monk-protected)
5. **Ravenkeeper** → *if they died tonight*, they pick a player and learn their role
6. **Empath** → neighbor check
7. **Fortune Teller** → picks 2, learns demon info
8. **Undertaker** → *if there was an execution today*, learns executed player's character
9. **Butler** → picks master

### Day Phase
1. **Dawn announcement:** Storyteller announces who died (if anyone), and any other public info
2. **Discussion:** Open conversation, players share (or lie about) info
3. **Nominations:** Any living player can nominate any player (each player can only nominate once per day, and can only be nominated once)
4. **Voting:** All players (including dead, if they have their vote token) vote on each nomination. Majority = "on the block"
5. **Execution:** At day's end, the player with the most votes (if majority) is executed

### Day Abilities (interrupt flow)
- **Slayer** (once per game): Publicly declare and choose a player. If Demon → they die immediately.
- **Virgin** (triggered): First time nominated, if nominator is Townsfolk → nominator is executed instead.

### Special Character Mechanics
- **Drunk:** Thinks they're a Townsfolk. Gets false/arbitrary info. Storyteller tracks real drunk token.
- **Recluse:** May register as evil/Minion/Demon to info abilities
- **Saint:** If executed (not killed at night), **evil wins immediately**
- **Mayor:** If 3 players alive + no execution → good wins. Also, if demon tries to kill Mayor at night, someone else might die instead.
- **Scarlet Woman:** If 5+ players alive and Demon dies, she becomes the Demon (game continues)
- **Imp self-kill:** If Imp kills themselves, a Minion becomes the new Imp (starpass)

### Win Conditions
- **Good wins:** Demon dies (unless Scarlet Woman triggers)
- **Evil wins:** Only 2 players remain alive
- **Saint executed:** Evil wins immediately
- **Mayor's 3-player no-execution:** Good wins

### Reminder Tokens (Storyteller tracks)
- Poisoned
- Protected (Monk)
- Dead
- No ability (spent once-per-game)
- Red herring (Fortune Teller's false positive)
- Master (Butler)
- Is the Demon (Scarlet Woman transformed)
- Drunk's "real" Townsfolk role

---

## Part 2: Affordances Analysis

| Aspect | You Mentioned | Needs Building |
|--------|---------------|----------------|
| Lobby/join with code | ✅ | — |
| Player sees their role | ✅ | — |
| Player sees character sheet | ✅ | — |
| Player sees alive/dead | ✅ | — |
| Storyteller grimoire | ✅ | — |
| Rules for storyteller | ✅ | — |
| **Night phase player prompting** | ❌ | Players need to submit night choices (Fortune Teller picks 2, Monk picks 1, etc.) |
| **Information delivery** | ❌ | Storyteller sends private info back to players (Washerwoman sees "A or B is Librarian") |
| **Evil team reveal** | ❌ | At game start, evil players see each other + Demon sees 3 bluffs |
| **Night action order guidance** | ❌ | Storyteller needs to know the order, app could enforce/guide it |
| **Day phase: nominations** | ❌ | Who nominated whom, tracking one-nom-per-player |
| **Day phase: voting** | ❌ | Vote counts, dead player vote tokens (one-time use) |
| **Day abilities (Slayer/Virgin)** | ❌ | Interrupt buttons, resolution |
| **Reminder tokens UI** | ❌ | Storyteller drags/toggles tokens on players |
| **Phase transitions** | ❌ | Day → Night → Day, with announcements |
| **Character reference (all roles)** | ❌ | Players should see the full script for deduction |
| **Game log/history** | ❌ | "Night 2: You learned 1 evil neighbor" — useful for players |
| **Drunk/Poison false info** | ❌ | Storyteller needs to manually input false info (app can't auto-generate good lies) |

### What I'd prioritize for MVP:
1. Lobby system ✅
2. Role assignment + display ✅
3. Evil team reveal (Demon sees Minions + 3 bluffs)
4. Simple game state (alive/dead, current phase)
5. Storyteller grimoire with reminder tokens
6. Night action submission (players submit choices)
7. Storyteller info delivery (private messages to players)
8. Basic nomination/voting

### Could defer:
- Automated night order enforcement (Storyteller can just follow a checklist)
- Day abilities (Slayer/Virgin can be handled manually with storyteller updating state)
- Full game log

---

## Part 3: Infrastructure

### Your proposed stack:
- **Fly.io** — WebSocket server (Hono)
- **Vercel** — Vite frontend
- **Hono** — Backend framework

This is solid! Here's my detailed thinking:

### WebSocket Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Vercel (Vite)  │         │  Vercel (Vite)  │
│  Player Phone   │         │  Storyteller PC │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ WebSocket                 │ WebSocket
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Fly.io    │
              │   (Hono)    │
              │             │
              │ Game State  │
              │ In-Memory + │
              │  Persist?   │
              └─────────────┘
```

### Key Decisions:

**1. State Persistence**
- In-memory is fine for active games
- But what if Fly.io restarts, or player refreshes?
- **Recommend:** Persist game state to SQLite (via Turso or Fly's built-in volumes) or even just a JSON file
- On reconnect, client gets full state sync

**2. Reconnection Handling (Critical for phones)**
- Phones kill WebSocket connections when backgrounded
- You need:
  - Automatic reconnect with exponential backoff
  - Session tokens (stored in localStorage) so player can rejoin as themselves
  - Full state sync on reconnect
  - Maybe a "player disconnected" indicator for Storyteller

**3. Single App vs Two Apps**
- I'd do **one Vite app** with responsive design
- Route-based views: `/play/:lobbyCode` (player) vs `/storyteller/:lobbyCode` (grimoire)
- Share components, types, WebSocket logic

**4. Security/Cheating Prevention**
- Server is authoritative — never send other players' roles to client
- Player client only receives:
  - Their own role
  - Public game state (alive/dead, phase, vote counts)
  - Private info addressed to them
- Storyteller client receives full state

**5. Night Phase Flow**
Two options:

**Option A: Fully Storyteller-Driven**
- Storyteller manually prompts each player (taps them IRL, or clicks "wake player" button)
- Player's phone shows "You're awake, make your choice"
- Player submits choice via WebSocket
- Storyteller sees it, manually sends back info
- Simpler, more control, closer to physical game

**Option B: Semi-Automated**
- Storyteller clicks "Start Night Phase"
- App automatically prompts players in correct order
- Players submit choices
- Some info auto-calculated (e.g., Empath neighbor count), Storyteller confirms before sending
- More complex, but smoother

I'd start with **Option A** for MVP.

**6. Message Types (WebSocket)**
```
// Server → Client
{ type: "GAME_STATE", state: {...} }
{ type: "NIGHT_PROMPT", action: "choose_players", count: 2 }
{ type: "PRIVATE_INFO", message: "You learned: Alice or Bob is the Chef" }
{ type: "PHASE_CHANGE", phase: "day", dayNumber: 2 }

// Client → Server (Player)
{ type: "JOIN_LOBBY", code: "ABC123", name: "Alice" }
{ type: "NIGHT_ACTION", choice: ["player_id_1", "player_id_2"] }
{ type: "VOTE", nominationId: "...", vote: true }

// Client → Server (Storyteller)
{ type: "START_GAME", roleAssignments: {...} }
{ type: "SEND_INFO", playerId: "...", message: "..." }
{ type: "SET_REMINDER", playerId: "...", token: "poisoned" }
{ type: "KILL_PLAYER", playerId: "..." }
```

### Potential Gotchas:

1. **Fly.io region:** Put it close to your players. Single region is fine for a friend group.

2. **WebSocket on Vercel:** Vercel doesn't support WebSockets on their serverless functions. Your Vite app just serves static files from Vercel and connects to Fly.io for WebSocket. That's fine!

3. **CORS:** Make sure Fly.io allows connections from your Vercel domain.

4. **Lobby cleanup:** Games should expire after some time (24h?) to avoid memory leaks.

5. **Mobile Safari quirks:** Test WebSocket reconnection on iOS Safari specifically—it's finicky with background tabs.

---

### Summary

Your stack is good. Main things to add to your mental model:
1. **Reconnection strategy** — phones will disconnect constantly
2. **Session persistence** — players need to rejoin as themselves
3. **Night flow decision** — manual vs semi-auto
4. **State persistence** — at minimum for crash recovery

Want to dive deeper into any of these, or are you ready to start sketching out the data models?

```plaintext
┌─────────────────┐         ┌─────────────────┐
│  Vercel (Vite)  │         │  Vercel (Vite)  │
│  Player Phone   │         │  Storyteller PC │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ WebSocket                 │ WebSocket
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Fly.io    │
              │   (Hono)    │
              │             │
              │ Game State  │
              │ In-Memory + │
              │  Persist?   │
              └─────────────┘
```

```plaintext
// Server → Client
{ type: "GAME_STATE", state: {...} }
{ type: "NIGHT_PROMPT", action: "choose_players", count: 2 }
{ type: "PRIVATE_INFO", message: "You learned: Alice or Bob is the Chef" }
{ type: "PHASE_CHANGE", phase: "day", dayNumber: 2 }

// Client → Server (Player)
{ type: "JOIN_LOBBY", code: "ABC123", name: "Alice" }
{ type: "NIGHT_ACTION", choice: ["player_id_1", "player_id_2"] }
{ type: "VOTE", nominationId: "...", vote: true }

// Client → Server (Storyteller)
{ type: "START_GAME", roleAssignments: {...} }
{ type: "SEND_INFO", playerId: "...", message: "..." }
{ type: "SET_REMINDER", playerId: "...", token: "poisoned" }
{ type: "KILL_PLAYER", playerId: "..." }
```

---

**User**

yeah! i think i need a db for sure. should i set up a postgres db for this? or is just a simple sqldb more than enough? what do you think?

---

**Cursor**

For this use case, **SQLite is more than enough** — and I'd actually recommend it over Postgres. Here's my reasoning:

### Why SQLite wins here:

1. **Your data model is simple**
   - Lobbies, players, game state, reminder tokens
   - No complex joins or aggregations
   - Most reads/writes are by lobby code (simple key lookup)

2. **Single server is fine**
   - You're not building for thousands of concurrent games
   - Friend groups playing together = maybe a handful of active lobbies
   - SQLite handles this trivially

3. **Real-time state lives in memory anyway**
   - WebSocket server keeps active game state in memory for speed
   - DB is just for recovery (server restart, crash) and lobby persistence
   - You're not hammering the DB with every game action

4. **Zero infrastructure overhead**
   - No separate database service to manage
   - No connection strings, connection pools, or cold starts
   - No extra cost (Fly Postgres = $$$, SQLite = free)

5. **Deployment simplicity**
   - SQLite file lives on a Fly.io persistent volume
   - Or use **Turso** (managed SQLite, free tier is generous) if you want backups + a nice dashboard

---

### Two good options:

**Option A: SQLite on Fly.io Volume**
```
fly volumes create data --size 1
```
Mount it, point your SQLite at `/data/botc.db`. Done. Free.

**Option B: Turso (Managed SQLite)**
- Hosted, replicated SQLite
- Free tier: 9GB storage, 500M row reads/month
- Nice CLI and dashboard
- Good if you want backups without thinking about it
- Works great with Drizzle or Prisma

---

### When you'd want Postgres instead:

- Multiple server instances (horizontal scaling)
- Complex analytical queries
- Full-text search needs
- You need Postgres-specific features (JSONB queries, etc.)

None of these apply to your game. You're managing ephemeral game sessions for small groups.

---

### My recommendation:

Start with **Turso**. It's:
- Free
- Managed (no volume config to mess with)
- Has a nice migration story
- Works seamlessly with Drizzle ORM (great DX with Hono)

If you want absolute simplicity and don't care about managed backups, just do SQLite on a Fly volume.

---

Want to talk about the schema next, or the WebSocket message protocol?

```plaintext
fly volumes create data --size 1
```

---

**User**

websocket protocol next please!

---

**Cursor**

Alright, let's design this properly. I'll break it down by game phase and actor.

---

## Core Principles

1. **Server is authoritative** — clients send intentions, server validates and broadcasts results
2. **Full state sync on connect** — no deltas for MVP, just send the whole game state
3. **Typed messages** — discriminated union on `type` field
4. **Player vs Storyteller** — some messages only make sense for one role

---

## Connection & Lobby Phase

### Client → Server

```typescript
// Player joining a lobby
{
  type: "JOIN_LOBBY",
  lobbyCode: "ABC123",
  playerName: "Alice",
  sessionToken?: string  // for reconnection
}

// Storyteller creating a lobby
{
  type: "CREATE_LOBBY",
  script: "trouble_brewing"  // future-proofing for other scripts
}

// Storyteller starting the game
{
  type: "START_GAME",
  roleAssignments: {
    [playerId: string]: "imp" | "washerwoman" | ...
  },
  // Demon's 3 bluff characters (not in play)
  demonBluffs: ["chef", "empath", "slayer"]
}
```

### Server → Client

```typescript
// Lobby state update (sent to all in lobby)
{
  type: "LOBBY_STATE",
  lobbyCode: "ABC123",
  players: [
    { id: "abc", name: "Alice", connected: true },
    { id: "def", name: "Bob", connected: true }
  ],
  storytellerConnected: true,
  phase: "waiting"  // waiting | in_game
}

// Sent only to the player who just joined
{
  type: "SESSION_CREATED",
  sessionToken: "xyz789",  // store in localStorage
  playerId: "abc"
}

// Error responses
{
  type: "ERROR",
  code: "LOBBY_NOT_FOUND" | "NAME_TAKEN" | "GAME_ALREADY_STARTED" | ...,
  message: "Human readable error"
}
```

---

## Game Start

### Server → Player

```typescript
// Sent to each player individually when game starts
{
  type: "GAME_STARTED",
  yourRole: "fortune_teller",
  // Only sent to Minions and Demon:
  evilTeam?: [
    { playerId: "abc", role: "imp" },
    { playerId: "def", role: "poisoner" }
  ],
  // Only sent to Demon:
  bluffs?: ["chef", "empath", "slayer"]
}
```

### Server → Storyteller

```typescript
// Full game state for grimoire
{
  type: "GAME_STATE",
  phase: "night",
  dayNumber: 0,  // 0 = first night
  players: [
    {
      id: "abc",
      name: "Alice",
      role: "fortune_teller",
      alive: true,
      voteTokenUsed: false,
      reminders: ["red_herring"]  // storyteller-only
    },
    // ...
  ],
  nightOrder: ["poisoner", "washerwoman", ...],  // who to wake
  bluffs: ["chef", "empath", "slayer"]
}
```

---

## Night Phase

### Server → Player

```typescript
// Player is being woken up for their action
{
  type: "NIGHT_PROMPT",
  instruction: "Choose a player to poison",
  actionType: "choose_player",
  count: 1,  // how many to choose
  // Or for info-only roles on first night:
  // actionType: "none" (just receiving info)
}

// Private info from Storyteller
{
  type: "PRIVATE_INFO",
  message: "Alice or Bob is the Chef"
}

// Your night action is done, go back to sleep
{
  type: "NIGHT_DONE"
}
```

### Player → Server

```typescript
// Submitting a night action
{
  type: "NIGHT_ACTION",
  targets: ["player_id_1"]  // array even for single target, for consistency
}
```

### Storyteller → Server

```typescript
// Wake a specific player
{
  type: "WAKE_PLAYER",
  playerId: "abc"
}

// Send info to a player
{
  type: "SEND_INFO",
  playerId: "abc",
  message: "You learned: 1 of your neighbors is evil"
}

// Mark player's night action as complete
{
  type: "PLAYER_SLEEP",
  playerId: "abc"
}

// End night phase, transition to day
{
  type: "END_NIGHT",
  deaths: ["player_id_1"],  // who died (could be empty if Monk saved)
  // Optionally announce cause? Or keep it simple
}
```

### Server → Storyteller

```typescript
// When a player submits their night action
{
  type: "NIGHT_ACTION_RECEIVED",
  playerId: "abc",
  targets: ["player_id_1", "player_id_2"]
}
```

---

## Day Phase

### Server → All

```typescript
// Dawn announcement
{
  type: "PHASE_CHANGE",
  phase: "day",
  dayNumber: 1,
  announcement: "The sun rises. Alice is dead. They were the Empath."
  // Deaths are public, roles revealed on death
}

// Public game state update
{
  type: "PUBLIC_STATE",
  players: [
    { id: "abc", name: "Alice", alive: false, roleRevealed: "empath" },
    { id: "def", name: "Bob", alive: true },
    // ...
  ],
  phase: "day",
  dayNumber: 1,
  onTheBlock: null | { playerId: "xyz", voteCount: 5 }
}
```

### Player → Server

```typescript
// Nominate a player
{
  type: "NOMINATE",
  targetPlayerId: "def"
}

// Vote on current nomination
{
  type: "VOTE",
  vote: true | false
}

// Slayer ability (day action)
{
  type: "DAY_ABILITY",
  ability: "slayer",
  targetPlayerId: "def"
}
```

### Server → All

```typescript
// Nomination opened
{
  type: "NOMINATION",
  nominatorId: "abc",
  nominatorName: "Alice",
  targetId: "def",
  targetName: "Bob",
  votingOpen: true
}

// Vote update (real-time count)
{
  type: "VOTE_UPDATE",
  targetId: "def",
  currentVotes: 5,
  votesNeeded: 4,  // majority threshold
  voterIds: ["abc", "ghi", ...]  // who has voted yes
}

// Voting closed on this nomination
{
  type: "NOMINATION_RESULT",
  targetId: "def",
  votes: 5,
  onTheBlock: true  // they're now on the block (or not)
}

// Slayer result
{
  type: "DAY_ABILITY_RESULT",
  ability: "slayer",
  playerId: "abc",
  targetId: "def",
  result: "miss"  // or "hit" if they were demon
}
```

### Storyteller → Server

```typescript
// Execute the player on the block
{
  type: "EXECUTE",
  playerId: "def"
}

// End day, transition to night
{
  type: "END_DAY"
}

// Manual overrides (storyteller has full control)
{
  type: "SET_PLAYER_STATE",
  playerId: "abc",
  updates: {
    alive?: boolean,
    reminders?: string[]
  }
}

// Add/remove reminder tokens
{
  type: "SET_REMINDER",
  playerId: "abc",
  reminder: "poisoned",
  action: "add" | "remove"
}
```

---

## Game End

### Server → All

```typescript
{
  type: "GAME_OVER",
  winner: "good" | "evil",
  reason: "demon_executed" | "two_players_remain" | "saint_executed" | "mayor_victory",
  // Full reveal for post-game discussion
  players: [
    { id: "abc", name: "Alice", role: "imp", alive: false },
    // ...
  ]
}
```

---

## Reconnection Flow

```
1. Client connects with sessionToken from localStorage
2. Server validates token, finds the player
3. Server sends appropriate state:
   - If in lobby: LOBBY_STATE
   - If in game: GAME_STARTED + GAME_STATE (or PUBLIC_STATE for players)
   - If their turn: also NIGHT_PROMPT
4. Player is back in sync
```

---

## Type Definitions (TypeScript)

Here's how I'd structure the types:

```typescript
// ===== Client → Server =====
type ClientMessage =
  | { type: "CREATE_LOBBY"; script: string }
  | { type: "JOIN_LOBBY"; lobbyCode: string; playerName: string; sessionToken?: string }
  | { type: "START_GAME"; roleAssignments: Record<string, Role>; demonBluffs: Role[] }
  | { type: "WAKE_PLAYER"; playerId: string }
  | { type: "SEND_INFO"; playerId: string; message: string }
  | { type: "PLAYER_SLEEP"; playerId: string }
  | { type: "END_NIGHT"; deaths: string[] }
  | { type: "NIGHT_ACTION"; targets: string[] }
  | { type: "NOMINATE"; targetPlayerId: string }
  | { type: "VOTE"; vote: boolean }
  | { type: "DAY_ABILITY"; ability: string; targetPlayerId: string }
  | { type: "EXECUTE"; playerId: string }
  | { type: "END_DAY" }
  | { type: "SET_REMINDER"; playerId: string; reminder: string; action: "add" | "remove" }
  | { type: "SET_PLAYER_STATE"; playerId: string; updates: Partial<PlayerState> }

// ===== Server → Client =====
type ServerMessage =
  | { type: "ERROR"; code: string; message: string }
  | { type: "SESSION_CREATED"; sessionToken: string; playerId: string }
  | { type: "LOBBY_STATE"; lobbyCode: string; players: LobbyPlayer[]; storytellerConnected: boolean; phase: "waiting" | "in_game" }
  | { type: "GAME_STARTED"; yourRole: Role; evilTeam?: EvilTeamMember[]; bluffs?: Role[] }
  | { type: "GAME_STATE"; /* full state for storyteller */ }
  | { type: "PUBLIC_STATE"; /* sanitized state for players */ }
  | { type: "NIGHT_PROMPT"; instruction: string; actionType: string; count?: number }
  | { type: "NIGHT_DONE" }
  | { type: "PRIVATE_INFO"; message: string }
  | { type: "NIGHT_ACTION_RECEIVED"; playerId: string; targets: string[] }
  | { type: "PHASE_CHANGE"; phase: "day" | "night"; dayNumber: number; announcement?: string }
  | { type: "NOMINATION"; nominatorId: string; nominatorName: string; targetId: string; targetName: string }
  | { type: "VOTE_UPDATE"; targetId: string; currentVotes: number; votesNeeded: number; voterIds: string[] }
  | { type: "NOMINATION_RESULT"; targetId: string; votes: number; onTheBlock: boolean }
  | { type: "DAY_ABILITY_RESULT"; ability: string; playerId: string; targetId: string; result: string }
  | { type: "GAME_OVER"; winner: "good" | "evil"; reason: string; players: PlayerReveal[] }
```

---

## Open Questions

1. **Voting visibility:** Should players see who voted yes/no in real-time? Or only final counts? (I assumed visible for transparency, but hidden could add intrigue)

2. **Night action visibility for Storyteller:** Should the Storyteller see actions as they're submitted, or only after prompting each player? (I assumed immediate visibility)

3. **Timing:** Should nominations/voting have time limits? Or fully manual (Storyteller closes voting)?

---

What do you think? Anything you'd change or want to drill into further?

```typescript
// Player joining a lobby
{
  type: "JOIN_LOBBY",
  lobbyCode: "ABC123",
  playerName: "Alice",
  sessionToken?: string  // for reconnection
}

// Storyteller creating a lobby
{
  type: "CREATE_LOBBY",
  script: "trouble_brewing"  // future-proofing for other scripts
}

// Storyteller starting the game
{
  type: "START_GAME",
  roleAssignments: {
    [playerId: string]: "imp" | "washerwoman" | ...
  },
  // Demon's 3 bluff characters (not in play)
  demonBluffs: ["chef", "empath", "slayer"]
}
```

```typescript
// Lobby state update (sent to all in lobby)
{
  type: "LOBBY_STATE",
  lobbyCode: "ABC123",
  players: [
    { id: "abc", name: "Alice", connected: true },
    { id: "def", name: "Bob", connected: true }
  ],
  storytellerConnected: true,
  phase: "waiting"  // waiting | in_game
}

// Sent only to the player who just joined
{
  type: "SESSION_CREATED",
  sessionToken: "xyz789",  // store in localStorage
  playerId: "abc"
}

// Error responses
{
  type: "ERROR",
  code: "LOBBY_NOT_FOUND" | "NAME_TAKEN" | "GAME_ALREADY_STARTED" | ...,
  message: "Human readable error"
}
```

```typescript
// Sent to each player individually when game starts
{
  type: "GAME_STARTED",
  yourRole: "fortune_teller",
  // Only sent to Minions and Demon:
  evilTeam?: [
    { playerId: "abc", role: "imp" },
    { playerId: "def", role: "poisoner" }
  ],
  // Only sent to Demon:
  bluffs?: ["chef", "empath", "slayer"]
}
```

```typescript
// Full game state for grimoire
{
  type: "GAME_STATE",
  phase: "night",
  dayNumber: 0,  // 0 = first night
  players: [
    {
      id: "abc",
      name: "Alice",
      role: "fortune_teller",
      alive: true,
      voteTokenUsed: false,
      reminders: ["red_herring"]  // storyteller-only
    },
    // ...
  ],
  nightOrder: ["poisoner", "washerwoman", ...],  // who to wake
  bluffs: ["chef", "empath", "slayer"]
}
```

```typescript
// Player is being woken up for their action
{
  type: "NIGHT_PROMPT",
  instruction: "Choose a player to poison",
  actionType: "choose_player",
  count: 1,  // how many to choose
  // Or for info-only roles on first night:
  // actionType: "none" (just receiving info)
}

// Private info from Storyteller
{
  type: "PRIVATE_INFO",
  message: "Alice or Bob is the Chef"
}

// Your night action is done, go back to sleep
{
  type: "NIGHT_DONE"
}
```

```typescript
// Submitting a night action
{
  type: "NIGHT_ACTION",
  targets: ["player_id_1"]  // array even for single target, for consistency
}
```

```typescript
// Wake a specific player
{
  type: "WAKE_PLAYER",
  playerId: "abc"
}

// Send info to a player
{
  type: "SEND_INFO",
  playerId: "abc",
  message: "You learned: 1 of your neighbors is evil"
}

// Mark player's night action as complete
{
  type: "PLAYER_SLEEP",
  playerId: "abc"
}

// End night phase, transition to day
{
  type: "END_NIGHT",
  deaths: ["player_id_1"],  // who died (could be empty if Monk saved)
  // Optionally announce cause? Or keep it simple
}
```

```typescript
// When a player submits their night action
{
  type: "NIGHT_ACTION_RECEIVED",
  playerId: "abc",
  targets: ["player_id_1", "player_id_2"]
}
```

```typescript
// Dawn announcement
{
  type: "PHASE_CHANGE",
  phase: "day",
  dayNumber: 1,
  announcement: "The sun rises. Alice is dead. They were the Empath."
  // Deaths are public, roles revealed on death
}

// Public game state update
{
  type: "PUBLIC_STATE",
  players: [
    { id: "abc", name: "Alice", alive: false, roleRevealed: "empath" },
    { id: "def", name: "Bob", alive: true },
    // ...
  ],
  phase: "day",
  dayNumber: 1,
  onTheBlock: null | { playerId: "xyz", voteCount: 5 }
}
```

```typescript
// Nominate a player
{
  type: "NOMINATE",
  targetPlayerId: "def"
}

// Vote on current nomination
{
  type: "VOTE",
  vote: true | false
}

// Slayer ability (day action)
{
  type: "DAY_ABILITY",
  ability: "slayer",
  targetPlayerId: "def"
}
```

```typescript
// Nomination opened
{
  type: "NOMINATION",
  nominatorId: "abc",
  nominatorName: "Alice",
  targetId: "def",
  targetName: "Bob",
  votingOpen: true
}

// Vote update (real-time count)
{
  type: "VOTE_UPDATE",
  targetId: "def",
  currentVotes: 5,
  votesNeeded: 4,  // majority threshold
  voterIds: ["abc", "ghi", ...]  // who has voted yes
}

// Voting closed on this nomination
{
  type: "NOMINATION_RESULT",
  targetId: "def",
  votes: 5,
  onTheBlock: true  // they're now on the block (or not)
}

// Slayer result
{
  type: "DAY_ABILITY_RESULT",
  ability: "slayer",
  playerId: "abc",
  targetId: "def",
  result: "miss"  // or "hit" if they were demon
}
```

```typescript
// Execute the player on the block
{
  type: "EXECUTE",
  playerId: "def"
}

// End day, transition to night
{
  type: "END_DAY"
}

// Manual overrides (storyteller has full control)
{
  type: "SET_PLAYER_STATE",
  playerId: "abc",
  updates: {
    alive?: boolean,
    reminders?: string[]
  }
}

// Add/remove reminder tokens
{
  type: "SET_REMINDER",
  playerId: "abc",
  reminder: "poisoned",
  action: "add" | "remove"
}
```

```typescript
{
  type: "GAME_OVER",
  winner: "good" | "evil",
  reason: "demon_executed" | "two_players_remain" | "saint_executed" | "mayor_victory",
  // Full reveal for post-game discussion
  players: [
    { id: "abc", name: "Alice", role: "imp", alive: false },
    // ...
  ]
}
```

```plaintext
1. Client connects with sessionToken from localStorage
2. Server validates token, finds the player
3. Server sends appropriate state:
   - If in lobby: LOBBY_STATE
   - If in game: GAME_STARTED + GAME_STATE (or PUBLIC_STATE for players)
   - If their turn: also NIGHT_PROMPT
4. Player is back in sync
```

```typescript
// ===== Client → Server =====
type ClientMessage =
  | { type: "CREATE_LOBBY"; script: string }
  | { type: "JOIN_LOBBY"; lobbyCode: string; playerName: string; sessionToken?: string }
  | { type: "START_GAME"; roleAssignments: Record<string, Role>; demonBluffs: Role[] }
  | { type: "WAKE_PLAYER"; playerId: string }
  | { type: "SEND_INFO"; playerId: string; message: string }
  | { type: "PLAYER_SLEEP"; playerId: string }
  | { type: "END_NIGHT"; deaths: string[] }
  | { type: "NIGHT_ACTION"; targets: string[] }
  | { type: "NOMINATE"; targetPlayerId: string }
  | { type: "VOTE"; vote: boolean }
  | { type: "DAY_ABILITY"; ability: string; targetPlayerId: string }
  | { type: "EXECUTE"; playerId: string }
  | { type: "END_DAY" }
  | { type: "SET_REMINDER"; playerId: string; reminder: string; action: "add" | "remove" }
  | { type: "SET_PLAYER_STATE"; playerId: string; updates: Partial<PlayerState> }

// ===== Server → Client =====
type ServerMessage =
  | { type: "ERROR"; code: string; message: string }
  | { type: "SESSION_CREATED"; sessionToken: string; playerId: string }
  | { type: "LOBBY_STATE"; lobbyCode: string; players: LobbyPlayer[]; storytellerConnected: boolean; phase: "waiting" | "in_game" }
  | { type: "GAME_STARTED"; yourRole: Role; evilTeam?: EvilTeamMember[]; bluffs?: Role[] }
  | { type: "GAME_STATE"; /* full state for storyteller */ }
  | { type: "PUBLIC_STATE"; /* sanitized state for players */ }
  | { type: "NIGHT_PROMPT"; instruction: string; actionType: string; count?: number }
  | { type: "NIGHT_DONE" }
  | { type: "PRIVATE_INFO"; message: string }
  | { type: "NIGHT_ACTION_RECEIVED"; playerId: string; targets: string[] }
  | { type: "PHASE_CHANGE"; phase: "day" | "night"; dayNumber: number; announcement?: string }
  | { type: "NOMINATION"; nominatorId: string; nominatorName: string; targetId: string; targetName: string }
  | { type: "VOTE_UPDATE"; targetId: string; currentVotes: number; votesNeeded: number; voterIds: string[] }
  | { type: "NOMINATION_RESULT"; targetId: string; votes: number; onTheBlock: boolean }
  | { type: "DAY_ABILITY_RESULT"; ability: string; playerId: string; targetId: string; result: string }
  | { type: "GAME_OVER"; winner: "good" | "evil"; reason: string; players: PlayerReveal[] }
```

