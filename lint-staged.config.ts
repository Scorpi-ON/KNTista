export default {
    "front/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun --cwd front run --bun prettier --write --ignore-path ../.gitignore",
    "front/**/*.{js,jsx,mjs,ts,tsx}": [
        "bun --cwd front run --bun prettier --write --ignore-path ../.gitignore",
        "bun --cwd front run --bun eslint --fix",
    ],
    "back/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun --cwd back run prettier --write --ignore-path ../.gitignore",
    "back/**/*.{js,mjs,ts}": [
        "bun --cwd back run prettier --write --ignore-path ../.gitignore",
        "bun --cwd back run eslint --fix",
    ],
    "tg/**/*.{json,md,yaml,yml,Dockerfile}":
        "bun --cwd tg run prettier --write --ignore-path ../.gitignore",
    "tg/**/*.{js,mjs,ts}": [
        "bun --cwd tg run prettier --write --ignore-path ../.gitignore",
        "bun --cwd tg run eslint --fix",
    ],
    "**/package.json": () => ["bun install", "git add bun.lock"],
};
