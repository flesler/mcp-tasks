#!/bin/bash
set -e

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Execute command or just echo it based on dry-run flag
run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "   [DRY] $*"
  else
    "$@"
  fi
}

# Read package info from package.json
PACKAGE_NAME=$(jq -r '.name' package.json)
PACKAGE_VERSION=$(jq -r '.version' package.json)

# Extract GitHub username from git remote URL
GIT_URL=$(git config --get remote.origin.url)
GITHUB_USER=$(echo "$GIT_URL" | sed -E 's|.*[:/]([^/]+)/.*|\1|')
DOCKER_REPO="${GITHUB_USER}/${PACKAGE_NAME}"

echo "📦 Publishing ${PACKAGE_NAME} v${PACKAGE_VERSION} to Docker Hub..."
echo "🐙 GitHub user: ${GITHUB_USER}"

# Build the Docker image
echo "🔨 Building Docker image..."
run docker build -t "${DOCKER_REPO}" .

# Push latest tag
echo "🚀 Pushing ${DOCKER_REPO}:latest..."
run docker push "${DOCKER_REPO}"

# Tag and push specific version
echo "🏷️  Tagging and pushing ${DOCKER_REPO}:${PACKAGE_VERSION}..."
run docker tag "${DOCKER_REPO}" "${DOCKER_REPO}:${PACKAGE_VERSION}"
run docker push "${DOCKER_REPO}:${PACKAGE_VERSION}"

echo "✅ Successfully published to Docker Hub!"
echo "   Latest: ${DOCKER_REPO}:latest"
echo "   Version: ${DOCKER_REPO}:${PACKAGE_VERSION}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "💡 This was a dry run. Run without --dry-run to actually publish."
fi 