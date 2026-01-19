#!/bin/bash

echo ""
echo "========================================"
echo "  FlowLogic Quick Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "This script will help you set up your Supabase credentials."
echo "You can find these at: https://app.supabase.com/project/_/settings/api"
echo ""
echo ""

# Run the setup script
node setup.js
