# PostIQ API Documentation

## Base URL
```
Development: http://localhost:4000/api
Production: https://your-api.render.com/api
```

## Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### Health Check
```
GET /health
```
Response:
```json
{ "success": true, "data": { "status": "healthy", "version": "1.0.0" } }
```

---

### Auth

#### Register
```
POST /auth/register
Body: { "email": "user@example.com", "password": "min8chars" }
Response: { "success": true, "data": { "token": "jwt...", "user": { "id", "email", "planType" } } }
```

#### Login
```
POST /auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "success": true, "data": { "token": "jwt...", "user": {...} } }
```

#### Get Profile
```
GET /auth/profile  [Auth Required]
Response: { "success": true, "data": { "id", "email", "planType", "_count": { "posts": 5 } } }
```

---

### Post Generation
```
POST /generate  [Auth Required]
Body: {
  "topic": "5 productivity hacks for remote workers",
  "platform": "INSTAGRAM",  // INSTAGRAM | LINKEDIN | X | FACEBOOK | TIKTOK
  "tone": "professional",   // professional | casual | inspirational | educational | humorous | authoritative | empathetic | provocative
  "lengthPreference": "medium",  // short | medium | long
  "audience": "tech professionals"
}
Response: {
  "success": true,
  "data": {
    "postId": "uuid",
    "content": "Generated post...",
    "platform": "INSTAGRAM",
    "metadata": { "wordCount": 85, "charCount": 450, "hashtagCount": 8, "estimatedReadTime": "1 min read" }
  }
}
```

#### Post History
```
GET /generate/history?page=1&limit=20  [Auth Required]
```

---

### Platform Adaptation
```
POST /adapt  [Auth Required]
Body: {
  "content": "Original post content...",
  "targetPlatforms": ["LINKEDIN", "X", "TIKTOK"]
}
Response: {
  "success": true,
  "data": {
    "original": "...",
    "adaptations": [
      { "platform": "LINKEDIN", "content": "...", "metadata": { "wordCount": 120, "charCount": 600, "hashtagCount": 4, "withinLimits": true } }
    ]
  }
}
```

---

### Structural Analysis
```
POST /analyse  [Auth Required]
Body: { "content": "Post to analyse...", "platform": "INSTAGRAM" }
Response: {
  "success": true,
  "data": {
    "hook": "...", "body": "...", "cta": "...",
    "emotionalTriggerWords": ["powerful", "transform"],
    "questionCount": 1, "readabilityLevel": "moderate",
    "sentenceCount": 5, "avgWordsPerSentence": 12,
    "toneDetected": "professional", "structureQuality": "strong",
    "wordCount": 85, "charCount": 450, "hashtagCount": 8,
    "hashtags": ["#productivity"], "lineCount": 8, "emojiCount": 3
  }
}
```

---

### Engagement Scoring
```
POST /score  [Auth Required]
Body: { "content": "Post to score...", "platform": "INSTAGRAM", "postId": "optional-uuid" }
Response: {
  "success": true,
  "data": {
    "totalScore": 78,
    "grade": "B",
    "breakdown": {
      "hookStrength": { "score": 14, "max": 20, "reason": "..." },
      "ctaPresence": { "score": 7, "max": 10, "reason": "..." },
      "emotionalIntensity": { "score": 10, "max": 15, "reason": "..." },
      "platformLengthCompliance": { "score": 15, "max": 15, "reason": "..." },
      "hashtagOptimisation": { "score": 10, "max": 10, "reason": "..." },
      "readabilityMatch": { "score": 15, "max": 15, "reason": "..." },
      "questionEngagement": { "score": 7, "max": 10, "reason": "..." },
      "penalties": { "score": 0, "max": -15, "reasons": [] }
    },
    "suggestions": ["Add more power words..."]
  }
}
```

---

### Risk Detection
```
POST /risk  [Auth Required]
Body: { "content": "Post to check..." }
Response: {
  "success": true,
  "data": {
    "riskLevel": "low",
    "warnings": [],
    "passedChecks": ["No engagement bait", "No spam phrases", ...]
  }
}
```

---

### Image Optimisation
```
POST /image/optimise  [Auth Required]
Content-Type: multipart/form-data
Body: image (file), ratios[] (optional: "1:1", "4:5", "16:9", "9:16")
Response: {
  "success": true,
  "data": {
    "original": { "width": 3000, "height": 2000, "ratio": "3:2" },
    "suggestedRatios": ["1:1 — Square", "4:5 — Portrait", ...],
    "optimised": [
      { "ratio": "1:1", "width": 1080, "height": 1080, "filename": "abc_1x1.webp", "path": "/uploads/optimised/abc_1x1.webp", "sizeKB": 85 }
    ]
  }
}
```

---

## Error Responses
```json
{ "success": false, "error": "Error message" }
```

Validation errors:
```json
{ "success": false, "error": "Validation failed", "details": [{ "field": "topic", "message": "Required" }] }
```

## Rate Limits
- General API: 100 requests / 15 min
- Auth endpoints: 10 requests / 15 min
- AI endpoints: 20 requests / 1 min
