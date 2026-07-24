import asyncio
import httpx
from datetime import datetime

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        import sys
        sys.path.append("/Users/hasinnn/Pdd/CiviFix-pdd/Backend")
        from app.core.security import SecurityUtils
        
        token = SecurityUtils.create_access_token({
            "sub": "test@civifix.com",
            "role": "CITIZEN",
            "user_id": "64d2b2f1e4b00f12c9e7a83d"
        })
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Simulate empty selectedImages (no images field in multipart/form-data)
        # Using httpx `data` as dict + `files=None` will send application/x-www-form-urlencoded.
        # To force multipart/form-data WITHOUT files, we must construct it manually or use httpx `files` with a dummy field?
        # Actually, in httpx, if you don't pass files, it sends URL encoded.
        # But frontend uses FormData which ALWAYS sends multipart/form-data!
        
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="ward_id"\r\n\r\n64d2b2f1e4b00f12c9e7a83d\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="complaint_type"\r\n\r\nGARBAGE\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="description"\r\n\r\nGarbage has not been collected near the park for 2 weeks.\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="priority"\r\n\r\nMEDIUM\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="latitude"\r\n\r\n13.0827\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="longitude"\r\n\r\n80.2707\r\n'
            f"--{boundary}--\r\n"
        )
        
        headers_multipart = {
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
        
        res = await client.post("/api/v1/complaints", content=body, headers=headers_multipart)
        print("Multipart without images field response:", res.status_code, res.text)
        
        # Test 2: With empty blob hack (what frontend USED to do)
        body_with_empty_blob = body.replace(f"--{boundary}--\r\n", 
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="images"; filename=""\r\nContent-Type: application/octet-stream\r\n\r\n\r\n'
            f"--{boundary}--\r\n"
        )
        res2 = await client.post("/api/v1/complaints", content=body_with_empty_blob, headers=headers_multipart)
        print("Multipart with empty blob response:", res2.status_code, res2.text)

if __name__ == "__main__":
    asyncio.run(test())
