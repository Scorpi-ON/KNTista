export default {
    "front/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun run -b --cwd front prettier --write --ignore-path ../.gitignore",
    "front/**/*.{js,jsx,mjs,ts,tsx}": [
        "bun run -b --cwd front prettier --write --ignore-path ../.gitignore",
        "bun run -b --cwd front eslint --fix",
    ],
    "back/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun run -b --cwd back prettier --write --ignore-path ../.gitignore",
    "back/**/*.{js,mjs,ts}": [
        "bun run -b --cwd back prettier --write --ignore-path ../.gitignore",
        "bun run -b --cwd back eslint --fix",
    ],
    "tg/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun run -b --cwd tg prettier --write --ignore-path ../.gitignore",
    "tg/**/*.{js,mjs,ts}": [
        "bun run -b --cwd tg prettier --write --ignore-path ../.gitignore",
        "bun run -b --cwd tg eslint --fix",
    ],
    "**/package.json": () => ["bun install", "git add bun.lock"],
};
