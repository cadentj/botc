# Notes to self

## On including `dist/` in the deployment

`"files" : ["dist"]` will keep the `dist/` dir in the deploy, even if its in `.gitignore`.

Apparently this is a standard pattern? `deploy` respects the `.gitignore` so `node_modules/` aren't published, but you need to keep `dist/`. Files is basically an allow list of files/folders to include when package is packed (e.g. for publish or deploy).

## On websocket urls

I'm stupid but til that the `https://` before a url designates the protocol. And when hitting a websocket, you prepend the url with `ws://` or `wss://` (unencrypted or encrypted).