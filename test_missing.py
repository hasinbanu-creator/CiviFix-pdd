import asyncio
import httpx

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
        
        # Test JSON payload on an endpoint expecting Form(...)
        data = {
            "ward_id": "64d2b2f1e4b00f12c9e7a83d",
            "complaint_type": "GARBAGE",
            "description": "Garbage has not been collected near the park for 2 weeks. JSON Test.",
            "priority": "MEDIUM",
            "latitude": 13.0827,
            "longitude": 80.2707
        }
        
        res = await client.post("/api/v1/complaints", json=data, headers=headers)
        print("JSON response to Form endpoint:", res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(test())
