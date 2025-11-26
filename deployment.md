# Deploying to fly

`fly apps create botc-server`
- Create an app on fly

`fly deploy -c apps/server/fly.toml`
- Deploys the server. Requires an existing app.

`fly volumes create botc_data --region dfw --size 1 -a botc-server`
- Create a 1gb volume in dfw (US Central). Requires an existing app. The above command should automatically do this.

`fly ssh console -a botc-server`
- SSH into the deployment.

# Managing volumes

- Need to navigate to `apps/server` to do this for some reason.