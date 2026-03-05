import os
import sys
import time
import socket
import json
import requests
import traceback

# Configuration loading
def load_config():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️ Warning: {config_path} not found. Creating default config.")
        default_config = {
            "backend_url": "http://localhost:8000/api/v1", # Update this with AWS URL
            "poll_interval": 2,
            "log_level": "INFO"
        }
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config

def fetch_pending_jobs(backend_url):
    """Fetch unprinted jobs from backend"""
    try:
        # Note: /print-jobs/pending is the endpoint we created
        response = requests.get(f"{backend_url}/print-jobs/pending", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Backend error: {response.status_code} - {response.text}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error while fetching jobs: {e}")
        return []

def mark_as_printed(backend_url, job_id):
    """Mark the job as printed on backend so it's not picked up again"""
    try:
        response = requests.post(f"{backend_url}/print-jobs/{job_id}/mark-printed", timeout=5)
        if response.status_code == 200:
            print(f"✅ Successfully marked job #{job_id} as printed.")
            return True
        else:
            print(f"❌ Failed to mark job #{job_id} as printed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error while marking job #{job_id}: {e}")
        return False

def send_to_printer(ip, port, content):
    """Connect to LAN printer via socket and send raw text content"""
    try:
        print(f"🖨️ Connecting to printer at {ip}:{port}...")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(10) # 10s timeout to avoid hanging
            s.connect((ip, port))
            
            # Send the content as bytes using utf-8 or cp437 depending on printer
            # Most modern thermal printers handle utf-8 if configured, 
            # but legacy ones might need cp437 or specific code pages.
            s.sendall(content.encode('utf-8'))
            print("🚀 Content sent to printer socket.")
            return True
    except socket.error as e:
        print(f"❌ Socket error (Printer Offline?): {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error printing: {e}")
        traceback.print_exc()
        return False

def main():
    config = load_config()
    backend_url = config.get("backend_url")
    poll_interval = config.get("poll_interval", 2)
    
    print(f"🚀 VayuPos Local Print Agent started.")
    print(f"🔗 Backend: {backend_url}")
    print(f"🕒 Polling every {poll_interval}s...")
    print("-----------------------------------------")
    
    while True:
        jobs = fetch_pending_jobs(backend_url)
        
        if jobs:
            print(f"📄 Found {len(jobs)} pending job(s).")
            for job in jobs:
                job_id = job.get('id')
                ip = job.get('printer_ip')
                port = job.get('printer_port', 9100)
                content = job.get('content')
                
                print(f"📍 Processing Job #{job_id} for printer {ip}:{port}...")
                
                if send_to_printer(ip, port, content):
                    # Only mark printed if socket send was successful
                    mark_as_printed(backend_url, job_id)
                else:
                    print(f"🔁 Retrying job #{job_id} in next poll cycle.")
        
        # Simple polling logic
        time.sleep(poll_interval)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Agent stopped by user.")
    except Exception as e:
        print(f"🔥 Critical agent failure: {e}")
        traceback.print_exc()
        # Keep window open if it crashed in a console
        input("Press Enter to close...")
