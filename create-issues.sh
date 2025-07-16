#!/bin/bash

# create-issues.sh - Create GitHub issues from JSON configuration
# Usage: ./create-issues.sh [issues.json]

set -e

# Configuration
ISSUES_FILE="issues.json"
LOG_FILE="issue-creation.log"
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if gh is installed
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is not installed. Please install it first."
        echo "Install: https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    # Check if in a git repository
    if ! git rev-parse --is-inside-work-tree &> /dev/null; then
        error "Not in a git repository. Please run this script from your project root."
        exit 1
    fi
    
    # Check if issues file exists
    if [ ! -f "$ISSUES_FILE" ]; then
        error "Issues file '$ISSUES_FILE' not found."
        exit 1
    fi
    
    # Check if jq is installed for JSON processing
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it for JSON processing."
        echo "Install: https://stedolan.github.io/jq/"
        exit 1
    fi
    
    success "All prerequisites met"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [[ "$1" != --* ]]; then
                    ISSUES_FILE="$1"
                fi
                shift
                ;;
        esac
    done
}

# Show help
show_help() {
    cat << EOF
Usage: $0 [OPTIONS] [ISSUES_FILE]

Create GitHub issues from JSON configuration file.

OPTIONS:
    --dry-run       Show what would be created without actually creating issues
    --help, -h      Show this help message

ARGUMENTS:
    ISSUES_FILE     Path to JSON file containing issue definitions (default: issues.json)

JSON FORMAT:
    [
        {
            "title": "Issue title",
            "body": "Issue body with markdown support",
            "labels": ["label1", "label2"]
        }
    ]

EXAMPLES:
    $0                          # Use default issues.json
    $0 my-issues.json          # Use custom file
    $0 --dry-run               # Preview without creating
    $0 --dry-run issues.json   # Preview custom file

EOF
}

# Validate JSON structure
validate_json() {
    log "Validating JSON structure..."
    
    # Check if JSON is valid
    if ! jq empty "$ISSUES_FILE" &> /dev/null; then
        error "Invalid JSON in '$ISSUES_FILE'"
        exit 1
    fi
    
    # Check if it's an array
    if [ "$(jq 'type' "$ISSUES_FILE")" != '"array"' ]; then
        error "JSON must be an array of issue objects"
        exit 1
    fi
    
    # Check required fields
    local missing_fields=()
    local issue_count=$(jq length "$ISSUES_FILE")
    
    for ((i=0; i<issue_count; i++)); do
        local issue=$(jq ".[$i]" "$ISSUES_FILE")
        
        if [ "$(echo "$issue" | jq 'has("title")')" = "false" ]; then
            missing_fields+=("Issue $((i+1)): missing 'title'")
        fi
        
        if [ "$(echo "$issue" | jq 'has("body")')" = "false" ]; then
            missing_fields+=("Issue $((i+1)): missing 'body'")
        fi
    done
    
    if [ ${#missing_fields[@]} -gt 0 ]; then
        error "JSON validation failed:"
        for field in "${missing_fields[@]}"; do
            echo "  - $field"
        done
        exit 1
    fi
    
    success "JSON structure is valid ($issue_count issues found)"
}

# Create a single issue
create_issue() {
    local issue_json="$1"
    local issue_num="$2"
    
    local title=$(echo "$issue_json" | jq -r '.title')
    local body=$(echo "$issue_json" | jq -r '.body')
    
    log "Creating issue $issue_num: $title"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  Title: $title"
        echo "  Body: $(echo "$body" | head -c 100)..."
        local labels=$(echo "$issue_json" | jq -r '.labels[]?' 2>/dev/null | tr '\n' ' ')
        if [ -n "$labels" ]; then
            echo "  Labels: $labels"
        fi
        echo ""
        return 0
    fi
    
    # Build gh issue create command args
    local cmd_args=()
    cmd_args+=("--title" "$title")
    cmd_args+=("--body" "$body")
    
    # Add labels if they exist
    local labels_array=$(echo "$issue_json" | jq -r '.labels[]?' 2>/dev/null)
    if [ -n "$labels_array" ]; then
        while IFS= read -r label; do
            if [ -n "$label" ]; then
                cmd_args+=("--label" "$label")
            fi
        done <<< "$labels_array"
    fi
    
    # Execute the command
    if gh issue create "${cmd_args[@]}"; then
        success "Created issue: $title"
        return 0
    else
        error "Failed to create issue: $title"
        return 1
    fi
}

# Create all issues
create_all_issues() {
    local issue_count=$(jq length "$ISSUES_FILE")
    local created_count=0
    local failed_count=0
    
    log "Creating $issue_count issues..."
    
    if [ "$DRY_RUN" = true ]; then
        warning "DRY RUN - No issues will be actually created"
        echo ""
    fi
    
    for ((i=0; i<issue_count; i++)); do
        local issue=$(jq ".[$i]" "$ISSUES_FILE")
        
        if create_issue "$issue" "$((i+1))"; then
            ((created_count++))
        else
            ((failed_count++))
        fi
        
        # Add a small delay to avoid rate limiting
        if [ "$DRY_RUN" = false ]; then
            sleep 1
        fi
    done
    
    # Summary
    echo ""
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN COMPLETE - Would have processed $issue_count issues"
    else
        log "CREATION COMPLETE"
        success "Created: $created_count issues"
        if [ $failed_count -gt 0 ]; then
            error "Failed: $failed_count issues"
        fi
    fi
}

# Main execution
main() {
    parse_arguments "$@"
    
    echo "GitHub Issue Creator"
    echo "==================="
    echo "Issues file: $ISSUES_FILE"
    echo ""
    
    check_prerequisites
    validate_json
    create_all_issues
    
    echo ""
    log "Log file: $LOG_FILE"
    
    if [ "$DRY_RUN" = false ]; then
        echo ""
        echo "View created issues: gh issue list"
        echo "Project issues: gh issue list --web"
    fi
}

# Run main function with all arguments
main "$@"