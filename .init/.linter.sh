#!/bin/bash
cd /home/kavia/workspace/code-generation/forest-focus-timer-96074-96083/pomodoro_timer_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

