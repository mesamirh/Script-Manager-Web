#!/usr/bin/env python3
"""
Sample Python Script for Script Manager Web
"""

import time
import os
from datetime import datetime

def main():
    print("🐍 Python Sample Script Started")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📂 Working directory: {os.getcwd()}")
    
    # Simulate some work
    for i in range(1, 6):
        print(f"⏳ Processing step {i}/5...")
        time.sleep(2)
        
        if i == 3:
            print("✨ Halfway done! This is working great.")
    
    print("✅ Python script completed successfully!")
    print(f"🎉 Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
