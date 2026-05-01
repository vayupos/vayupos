import os
import sys
import time
import socket
import json
import requests
import traceback


def load_config():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {config_path} not found. Creating default config.")
        default_config = {
            "backend_url": "https://api.vayupos.com/api/v1",
            "agent_key": "",
            "poll_interval": 2,
            "log_level": "INFO",
        }
        with open(config_path, "w") as f:
            json.dump(default_config, f, indent=4)
        return default_config


def fetch_pending_jobs(backend_url, agent_key):
    """Fetch unprinted jobs from backend for this restaurant."""
    try:
        response = requests.get(
            f"{backend_url}/print-jobs/pending",
            headers={"X-Print-Agent-Key": agent_key},
            timeout=5,
        )
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print("ERROR: Invalid agent key. Check 'agent_key' in config.json.")
            return []
        else:
            print(f"Backend error: {response.status_code} - {response.text}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Network error while fetching jobs: {e}")
        return []


def mark_as_printed(backend_url, agent_key, job_id):
    """Mark the job as printed so it is not picked up again."""
    try:
        response = requests.post(
            f"{backend_url}/print-jobs/{job_id}/mark-printed",
            headers={"X-Print-Agent-Key": agent_key},
            timeout=5,
        )
        if response.status_code == 200:
            print(f"Job #{job_id} marked as printed.")
            return True
        else:
            print(f"Failed to mark job #{job_id}: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Network error marking job #{job_id}: {e}")
        return False


def send_to_printer(ip, port, content):
    """Send raw ESC/POS content to a WiFi/LAN thermal printer via TCP socket."""
    try:
        print(f"Connecting to printer at {ip}:{port}...")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(10)
            s.connect((ip, int(port)))
            s.sendall(content.encode("utf-8"))
            print("Content sent to printer.")
            return True
    except socket.error as e:
        print(f"Socket error (printer offline?): {e}")
        return False
    except Exception as e:
        print(f"Unexpected error printing: {e}")
        traceback.print_exc()
        return False


def main():
    config = load_config()
    backend_url = config.get("backend_url", "").rstrip("/")
    agent_key = config.get("agent_key", "")
    poll_interval = config.get("poll_interval", 2)

    if not agent_key:
        print("ERROR: 'agent_key' is not set in config.json.")
        print("Get your key from VayuPOS Settings page and paste it into config.json.")
        input("Press Enter to close...")
        sys.exit(1)

    print("VayuPOS Local Print Agent started.")
    print(f"Backend: {backend_url}")
    print(f"Polling every {poll_interval}s  (Ctrl+C to stop)")
    print("-" * 45)

    while True:
        jobs = fetch_pending_jobs(backend_url, agent_key)

        if jobs:
            print(f"Found {len(jobs)} pending job(s).")
            for job in jobs:
                job_id = job.get("id")
                ip = job.get("printer_ip")
                port = job.get("printer_port", 9100)
                content = job.get("content")

                print(f"Processing job #{job_id} -> {ip}:{port}")

                if send_to_printer(ip, port, content):
                    mark_as_printed(backend_url, agent_key, job_id)
                else:
                    print(f"Will retry job #{job_id} in next poll cycle.")

        time.sleep(poll_interval)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAgent stopped.")
    except Exception as e:
        print(f"Critical agent failure: {e}")
        traceback.print_exc()
        input("Press Enter to close...")
