# JSON API ⇄ TypeSpec Converter - Makefile
# =============================================

.PHONY: help build test test-scenarios lint clean sandbox demo install dev

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
	@echo "  test-scenarios - Run user scenario tests"
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

test-scenarios: build
	@echo "🧪 Running user scenario tests..."
	npm test -- tests/scenarios/

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