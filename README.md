# Quix Backend

## Installation
Make sure to have pnpm installed, then run:
```sh
pnpm install
```

Then, copy the sample [.env.sample](./.env.sample) to `.env` in this directory and change the configurations as needed.
To get a github OAuth API key, [go here](https://github.com/settings/developers), make sure that the callback url there matches the env variable `GITHUB_REDIRECT_URI`.


Setup the database with:
```
npx prisma migrate dev
```
> Make sure to backup any data on the connected database if needed, this command will delete all existing data.


## Development
Run:
```sh
pnpm run dev
```

## Deployment
Run `pnpm run build` to compile to js, this is ready to be run with pm2 or other process managers
To run the backend using node, run `pnpm run preview`.
