import os
import uuid
import mimetypes
from supabase import create_client, Client

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise Exception("Supabase credentials not found in environment variables.")
    return create_client(url, key)

def upload_image_to_supabase(file_obj, folder_name="images") -> str:
    """
    Uploads a Django InMemoryUploadedFile or TemporaryUploadedFile to Supabase.
    Returns the public URL of the uploaded image.
    """
    if not file_obj:
        return ""

    supabase = get_supabase_client()
    bucket_name = os.getenv("SUPABASE_BUCKET", "cricket")

    # Generate a unique filename
    ext = os.path.splitext(file_obj.name)[1]
    filename = f"{folder_name}/{uuid.uuid4()}{ext}"

    # Determine content type
    content_type = mimetypes.guess_type(file_obj.name)[0] or "application/octet-stream"

    # Read file bytes
    file_bytes = file_obj.read()
    file_obj.seek(0)  # Reset file pointer just in case

    # Upload to Supabase Storage
    try:
        response = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
    except Exception as e:
        error_msg = str(e)
        if "403" in error_msg or "Unauthorized" in error_msg:
            print(f"\n[SUPABASE ERROR] Permission Denied. Please ensure you are using the 'service_role' key in your .env file.")
        elif "404" in error_msg:
            print(f"\n[SUPABASE ERROR] Bucket '{bucket_name}' not found. Please create a PUBLIC bucket named '{bucket_name}' in your Supabase dashboard.")
        else:
            print(f"\n[SUPABASE ERROR] {error_msg}")
        
        # Re-raise to let the serializer handle the API response
        raise e

def delete_image_from_supabase(public_url: str) -> bool:
    """
    Deletes an image from Supabase Storage using its public URL.
    Returns True if successful, False otherwise.
    """
    if not public_url:
        return False

    supabase = get_supabase_client()
    bucket_name = os.getenv("SUPABASE_BUCKET", "cricket")

    # Extract the relative path from the public URL
    # Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    parts = public_url.split(f"/{bucket_name}/")
    if len(parts) < 2:
        return False
    
    file_path = parts[1]

    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        return True
    except Exception as e:
        print(f"[SUPABASE DELETE ERROR] Failed to delete {file_path}: {e}")
        return False
