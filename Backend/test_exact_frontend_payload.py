import asyncio
import httpx

async def test():
    # We will simulate the frontend request EXACTLY as Axios sends it.
    # From frontend:
    # formData.append("ward_id", form.ward_id);
    # formData.append("complaint_type", form.complaint_type);
    # formData.append("description", form.description);
    # formData.append("priority", form.priority);
    # formData.append("latitude", form.latitude);
    # formData.append("longitude", form.longitude);
    # if (form.address) formData.append("address", form.address);
    # if (form.citizen_note) formData.append("citizen_note", form.citizen_note.trim());
    
    data = {
        "ward_id": "64d2b2f1e4b00f12c9e7a83d",
        "complaint_type": "GARBAGE",
        "description": "Garbage has not been collected near the park. Please fix it soon.",
        "priority": "MEDIUM",
        "latitude": "13.0827",
        "longitude": "80.2707",
        "address": "T Nagar",
        "citizen_note": "Please fix quickly",
    }
    
    # In my previous test payload I didn't send 'priority' ? 
    # Wait, in test_payload.py I sent it! But it failed with 401 instead of 422!
    # Let me bypass auth to see if validation fails before auth.
    # Auth happens at `Depends(get_current_user)`.
    # Pydantic validation happens BEFORE dependencies if they are body parameters!
    # Since my previous test_payload.py got 401, that means body validation PASSED!
    
    async with httpx.AsyncClient() as client:
        res = await client.post("http://127.0.0.1:8000/api/v1/complaints", data=data)
        print("Response:", res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(test())
