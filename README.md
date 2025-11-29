# Blood on the Clocktower

> Note: Oops, in-memory storage won't work on Vercel edge functions. Will need to re-deploy a backend to fly or smtn before wider use.

A simple version of BOTC for in person gatherings. For a fully featured online version, check out [clocktower.online](https://clocktower.online/).

![example](https://raw.githubusercontent.com/cadentj/botc/main/assets/example.png)

Features: 
- Expansions: Only Trouble Brewing at the moment.
- Multiplayer: Create a lobby as a storyteller and select a handful of characters. Share the code with players to distribute roles.
- All the storytelling necessities:
  - Helper cards, e.g. "These characters are not in play".
  - Svelte Flow for managing character / status tokens on an open canvas.
  - Night order lists, filtered by active roles.
  - Player names instantly associated with tokens in the grimoire so you don't have to collect tokens.
 
To make the in person experience more engaging, I purposely omit actions like voting from the game.

Roadmap: 
- Polling --> WS so I don't hit Vercel edge request limits.
- Support for Sects and Violets, Bad Moon Rising, and more custom scripts.
- Create a new game without needing to redistribute a code.
- Townsquare on player devices for more visiblity on what players are dead or not.

## Credit

Thank you [Steven Medway](https://x.com/Steve_Medway/) and [The Pandemonium Institute](https://bloodontheclocktower.com/) for such an amazing game!
