#!/bin/bash

QA_RUN_ID="qaRun_6t8s52npgwrihgpn"

echo "🔍 Monitoring QA Run: $QA_RUN_ID"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "=== QA Run Status ($(date +%H:%M:%S)) ==="
  echo ""

  curl -s "http://localhost:3001/api/qa-run/$QA_RUN_ID" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
print(f\"Status: {data['status']}\")
print(f\"Total Steps: {data['totalSteps']}\")
print(f\"Passed: {data['passedSteps']}\")
print(f\"Failed: {data['failedSteps']}\")
print(f\"Workspace ID: {data['daytonaWorkspaceId']}\")
if data['errorMessage']:
    print(f\"Error: {data['errorMessage']}\")
if data['aiAnalysisSummary']:
    print(f\"\nAI Analysis:\n{data['aiAnalysisSummary']}\")
"

  echo ""
  echo "Checking again in 5 seconds..."
  sleep 5
done
