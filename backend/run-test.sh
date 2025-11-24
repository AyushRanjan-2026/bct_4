#!/bin/bash
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi
nvm use 20
node reproduce-issue.js
