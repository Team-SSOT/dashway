# Dashway Issue Tracker — standalone web image
#
# TODO: implement multi-stage build.
#   - Stage 1: node:22-alpine, enable corepack/pnpm, install workspace deps,
#              run `pnpm --filter @dashway/issue-tracker build:web`.
#   - Stage 2: static server (nginx:alpine or similar) serving front/dist
#              with SPA fallback.
#
# Expected build args:
#   ARG VITE_GRAPHQL_ENDPOINT  # context-api GraphQL URL baked into the bundle
#
# Expected runtime:
#   EXPOSE 80
#   serves front/dist/index.html for unknown routes
