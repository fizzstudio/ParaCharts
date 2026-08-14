How to run the demo from the repository root:
1. Build the AI variant and start the demo server:
   npm run build:ai
   npm run demo:poll
2. In another terminal, start updating the manifest:
   python3 src/demo/poll/update_mani.py src/demo/poll/mani.json 0.5 35 65
3. When you're done, use Ctrl+C to terminate both processes.
4. Restore the tracked demo manifest:
   git restore src/demo/poll/mani.json
