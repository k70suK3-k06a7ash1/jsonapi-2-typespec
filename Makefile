pr:
	gh pr create --title "chore" --base develop --body 'feat'
merge:
	gh pr merge --merge

base:
	git switch develop && git pull origin develop

refresh:
	git switch develop && git pull origin develop && git switch -c "$$(( ( RANDOM % 9000 ) + 1000 ))"
## remake
r: refresh

# JSON API ⇄ TypeSpec Converter - Makefile
# =============================================

.PHONY: help build test lint clean sandbox demo install dev

# Default target
help:
	@echo "JSON API ⇄ TypeSpec Converter"
	@echo "============================="
	@echo ""
	@echo "Available commands:"
	@echo "  install     - Install dependencies"
	@echo "  build       - Build TypeScript code"
	@echo "  dev         - Build in watch mode"
	@echo "  test        - Run tests"
	@echo "  test-watch  - Run tests in watch mode"
	@echo "  lint        - Run linter"
	@echo "  clean       - Clean build artifacts"
	@echo "  sandbox     - Run sandbox demo (full conversion example)"
	@echo "  demo        - Alias for sandbox"
	@echo ""
	@echo "Sandbox structure:"
	@echo "  sandbox/inputs/     - Input schema files"
	@echo "  sandbox/outputs/    - Generated output files"
	@echo "  sandbox/scripts/    - Demo scripts"

# Development commands
install:
	@echo "📦 Installing dependencies..."
	npm install

build:
	@echo "🔨 Building TypeScript..."
	npm run build

dev:
	@echo "👀 Building in watch mode..."
	npm run dev

test:
	@echo "🧪 Running tests..."
	npm run test

test-watch:
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

lint:
	@echo "🔍 Running linter..."
	npm run lint

clean:
	@echo "🧹 Cleaning build artifacts..."
	npm run clean
	@rm -rf sandbox/outputs/*
	@echo "✅ Cleaned dist/ and sandbox/outputs/"

# Sandbox commands
sandbox: build
	@echo "🚀 Running sandbox demo..."
	@mkdir -p sandbox/outputs
	npx ts-node sandbox/scripts/sample-convert.ts

ruby-demo: build
	@echo "🚀 Running Ruby serializer conversion demo..."
	@mkdir -p sandbox/outputs
	npx ts-node sandbox/scripts/ruby-convert.ts

demo: sandbox

ruby: ruby-demo

# Show project structure
structure:
	@echo "📁 Project Structure:"
	@echo ""
	@tree -I 'node_modules|dist|.git' -a || ls -la

# Development workflow
setup: install build test
	@echo "✅ Setup complete! Ready for development."

# Quick development cycle
quick: build test
	@echo "✅ Quick build and test complete."