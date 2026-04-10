import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env
load_dotenv(".env")

def test_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    bucket_name = os.getenv("SUPABASE_BUCKET", "cricket")
    
    print(f"Testing Supabase connection...")
    print(f"URL: {url}")
    print(f"Key starts with: {key[:10]}...")
    print(f"Bucket: {bucket_name}")
    
    try:
        supabase: Client = create_client(url, key)
        buckets = supabase.storage.list_buckets()
        print(f"\nAvailable buckets:")
        for b in buckets:
            print(f"- {b.name} (Public: {b.public})")
            
        found = any(b.name == bucket_name for b in buckets)
        if found:
            print(f"\nSUCCESS: Bucket '{bucket_name}' found!")
        else:
            print(f"\nBucket '{bucket_name}' NOT found. Attempting to create it...")
            try:
                # Try to create a public bucket
                supabase.storage.create_bucket(bucket_name, options={'public': True})
                print(f"SUCCESS: Created public bucket '{bucket_name}'!")
            except Exception as create_err:
                print(f"FAILED to create bucket: {str(create_err)}")
                print("Suggestion: Manually create a PUBLIC bucket named 'cricket' in your Supabase Dashboard.")
            
    except Exception as e:
        print(f"\nEXCEPTION: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")

if __name__ == "__main__":
    test_supabase()
