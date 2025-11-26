# Notes to self

## On including `dist/` in the deployment

`"files" : ["dist"]` will keep the `dist/` dir in the deploy, even if its in `.gitignore`.

Apparently this is a standard pattern? `deploy` respects the `.gitignore` so `node_modules/` aren't published, but you need to keep `dist/`. Files is basically an allow list of files/folders to include when package is packed (e.g. for publish or deploy).

## On websocket urls

I'm stupid but til that the `https://` before a url designates the protocol. And when hitting a websocket, you prepend the url with `ws://` or `wss://` (unencrypted or encrypted).

## On node modules w dependencies

Make sure to run the `pnpm approve-builds` when installing `better-sqlite3

## On the vercel config file

> This is a classic SPA routing issue. When you reload on a client-side route like /storyteller/grimoire, Vercel tries to find an actual file at that path instead of letting your client-side router handle it.

- From Opus 4.5

## On security

- I don't verify that the storyteller ID matches the lobby ID when actions are taken. Lazy, less code, nobody will hack things.

# TODO

Game Flow
1. Storyteller visits `<url>/grimoire` to create a lobby. They get a menu to configure: 
   - number of players
   - expansion (only trouble brewing atm)
2. They press `Create Lobby` to create a game. This will initialize a lobby and storyteller player in the sqlite db on flyio.
3. The storyteller opens up into a page where they can see all of the available character tokens for the expansion. They are asked to select a valid combination of tokens for the number of players that they have. Once that is selected, a "Next" button appears.
4. Within the next page, the user can see an empty grimoire and a game code at the top. The game code is a 4 digit alphanumerical code that anybody in at `<url>` can enter, along with their name, to join the lobby.
5. Once the user has joined the lobby, they are randomly assigned a token.
   - If too many users join the lobby, they are notified that the game is full.
   - If a user disconnects from the game, do the best to reconnect to the right player given their IP. If this is not possible, logging in w the same name and game code should reconnect to the player. 
   - The game master should be able to open a menu of current players and delete one in case somone accidentally creates two players.
6. While players are joining the game, the storyteller can drag tokens corresponding to the characters around a virtual grimoire. Dragging tokens / arranging them is useful for the story teller to keep track of where users are in a room. 
   - The story teller has another tab with an info sheet that just has the order of what roles to visit each night. 

(decided against some parts of the above plan)

---

7. 