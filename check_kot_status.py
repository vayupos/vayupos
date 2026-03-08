import requests
import json

# Configuration
BACKEND_URL = "http://10.129.18.137:8000/api/v1"
TEST_PRINTER_IP = "192.168.1.150" # Change this to your actual printer IP for testing

def trigger_test_kot():
    print(f"🚀 Triggering Test KOT via {BACKEND_URL}...")
    
    # 1. First, we need an order ID. 
    # For testing, we'll create a mock print job directly if we don't want to create a full order.
    # But it's better to test the real flow.
    
    # Let's try to fetch pending jobs first to see if system is alive
    try:
        response = requests.get(f"{BACKEND_URL}/print-jobs/pending")
        if response.status_code == 200:
            print(f"✅ Backend is reachable. Pending jobs: {len(response.json())}")
        else:
            print(f"❌ Backend returned error: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Could not connect to backend: {e}")
        print("💡 Tip: Make sure your FastAPI server is running with --host 0.0.0.0")
        return

    print("\n📝 Step to check:")
    print("1. Open the 'local_print_agent' console (start_agent.bat).")
    print("2. Create a new order in your POS UI.")
    print("3. Watch the agent logs. It should say 'Found X pending job(s)'.")
    print("4. If you have no printer, use a tool like 'Hercules Setup' on port 9100.")

if __name__ == "__main__":
    trigger_test_kot()
