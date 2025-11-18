# Manual Testing in Daytona Workspace

This guide shows you how to manually run each step inside the Daytona workspace to debug issues.

## Step 1: Get Workspace ID

```bash
# Run from your local machine
cd /Users/quinortiz/Downloads/daytona/api
bun check-latest-run.ts
```

Copy the `Workspace ID` (something like `310a9a5b-f8df-494e-b420-4d8fdef70d97`)

## Step 2: Connect to Workspace

**Option A: Use Daytona CLI (if installed)**
```bash
daytona ssh <workspace-id>
```

**Option B: Use the debug scripts** (what we've been doing)
Create commands via the Daytona SDK and run them remotely.

## Step 3: Test Each Component Manually

### Test 1: Check if app is running

```bash
# Check if port 3000 is listening
lsof -i :3000

# Or check with netstat
netstat -tuln | grep 3000

# Check PM2 status
pm2 list

# Check PM2 logs
pm2 logs app --lines 50
```

### Test 2: Check if dependencies are installed

```bash
cd ~/app
ls -la node_modules/.bin/next
npm list next
```

### Test 3: Try to start the app manually

```bash
cd ~/app
npm run dev
```

### Test 4: Check if browser-use is installed

```bash
pip list | grep browser-use
python3 -c "from browser_use import Agent, Browser, ChatAnthropic; print('OK')"
```

### Test 5: Check if API key is accessible

```bash
# This won't show the actual key, just test if export works
export ANTHROPIC_API_KEY="test-key"
python3 -c "import os; print('Key length:', len(os.environ.get('ANTHROPIC_API_KEY', '')))"
```

### Test 6: Run the Python test script manually

```bash
# Find the test script
ls -la /tmp/test_*.py

# Read it
cat /tmp/test_testFlow_*.py

# Run it with your actual API key
export ANTHROPIC_API_KEY="your-actual-api-key-here"
cd /tmp
python3 test_testFlow_*.py 2>&1
```

## Want me to create a remote executor script?

I can create a script that connects to the workspace and runs these commands for you remotely.
