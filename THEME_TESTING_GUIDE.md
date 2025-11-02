# Theme Management Testing Guide

Hướng dẫn test đầy đủ các chức năng Theme và Theme Character.

## Setup

1. **Start Server**

```bash
cd server
npm start
```

2. **Get Authentication Token**

```bash
# Login as admin/employee
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

# Copy the token from response
```

## Test Cases

### 1. Theme - Create (Chức năng 51)

**Test Case 1.1: Create theme with all fields**

```bash
POST http://localhost:5001/api/themes
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

name=Summer Vibes
description=Bright and colorful summer theme
colors={"primary":"#FF6B6B","secondary":"#4ECDC4","background":"#FFE66D","text":"#2C3E50","accent":"#95E1D3"}
layout=modern
banner=@path/to/banner.jpg
```

**Expected Result**:

- Status: 201
- Response contains theme with all fields
- Banner URL is generated
- Default values applied for unspecified fields

**Test Case 1.2: Create theme with minimal fields**

```bash
POST http://localhost:5001/api/themes
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Minimal Theme"
}
```

**Expected Result**:

- Status: 201
- Default colors applied
- Default layout: "classic"
- isActive: true, isPublished: false

**Test Case 1.3: Duplicate theme name**

```bash
POST http://localhost:5001/api/themes
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Summer Vibes"  // Already exists
}
```

**Expected Result**:

- Status: 400
- Error: "Theme name already exists"

---

### 2. Theme - Update/Delete (Chức năng 52)

**Test Case 2.1: Update theme**

```bash
PUT http://localhost:5001/api/themes/THEME_ID
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Summer Vibes Updated",
  "colors": {
    "primary": "#FF0000"
  }
}
```

**Expected Result**:

- Status: 200
- Theme updated successfully
- Colors merged with existing

**Test Case 2.2: Delete theme without characters**

```bash
DELETE http://localhost:5001/api/themes/THEME_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- Message: "Theme deleted successfully"

**Test Case 2.3: Delete theme with characters**

```bash
# First create a character for the theme
# Then try to delete the theme

DELETE http://localhost:5001/api/themes/THEME_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 400
- Error: "Cannot delete theme. It has X character(s)..."

**Test Case 2.4: Delete published theme**

```bash
# First apply/publish the theme
POST http://localhost:5001/api/themes/THEME_ID/apply

# Then try to delete
DELETE http://localhost:5001/api/themes/THEME_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 400
- Error: "Cannot delete published theme..."

---

### 3. Theme - Search/Sort (Chức năng 53)

**Test Case 3.1: Search by name**

```bash
GET http://localhost:5001/api/themes?search=summer
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- Only themes matching "summer" returned
- Pagination info included

**Test Case 3.2: Sort by name ascending**

```bash
GET http://localhost:5001/api/themes?sortBy=name&sortOrder=asc
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Themes sorted alphabetically A-Z

**Test Case 3.3: Sort by popularity descending**

```bash
GET http://localhost:5001/api/themes?sortBy=popularity&sortOrder=desc
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Themes sorted by popularity (highest first)

**Test Case 3.4: Filter by active status**

```bash
GET http://localhost:5001/api/themes?isActive=true
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Only active themes returned

**Test Case 3.5: Pagination**

```bash
GET http://localhost:5001/api/themes?page=2&limit=5
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- 5 themes per page
- Page 2 data returned
- Pagination metadata correct

**Test Case 3.6: Combined filters**

```bash
GET http://localhost:5001/api/themes?search=ninja&sortBy=createdAt&sortOrder=desc&isActive=true&page=1&limit=10
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- All filters applied correctly
- Results match all criteria

---

### 4. Theme - Apply (Chức năng 54)

**Test Case 4.1: Preview theme**

```bash
POST http://localhost:5001/api/themes/THEME_ID/apply
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "preview": true
}
```

**Expected Result**:

- Status: 200
- Theme data returned
- isPublished remains unchanged
- No other theme affected

**Test Case 4.2: Apply/Publish theme**

```bash
POST http://localhost:5001/api/themes/THEME_ID/apply
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "preview": false
}
```

**Expected Result**:

- Status: 200
- Theme isPublished = true
- All other themes isPublished = false
- appliedCount incremented

**Test Case 4.3: Apply another theme (switch)**

```bash
# First apply theme A
POST http://localhost:5001/api/themes/THEME_A_ID/apply
{ "preview": false }

# Then apply theme B
POST http://localhost:5001/api/themes/THEME_B_ID/apply
{ "preview": false }
```

**Expected Result**:

- Theme A: isPublished = false
- Theme B: isPublished = true
- Only one theme published at a time

**Test Case 4.4: Get active theme (public)**

```bash
GET http://localhost:5001/api/themes/active
# No authentication needed
```

**Expected Result**:

- Status: 200
- Currently published theme returned
- Characters included

---

### 5. Theme Character - Create (Chức năng 55)

**Test Case 5.1: Create character with valid theme**

```bash
POST http://localhost:5001/api/themes/characters
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

name=Lloyd Green Ninja
themeId=VALID_THEME_ID
description=The green ninja leader
order=1
image=@path/to/character.png
```

**Expected Result**:

- Status: 201
- Character created with all fields
- Image URL generated
- Theme validation passed

**Test Case 5.2: Create character without image**

```bash
POST http://localhost:5001/api/themes/characters
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Test Character",
  "themeId": "VALID_THEME_ID"
}
```

**Expected Result**:

- Status: 400
- Error: "Character image is required"

**Test Case 5.3: Create character with invalid theme**

```bash
POST http://localhost:5001/api/themes/characters
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

name=Test Character
themeId=INVALID_THEME_ID
image=@path/to/image.png
```

**Expected Result**:

- Status: 400
- Error: "Theme not found"

---

### 6. Theme Character - Update (Chức năng 56)

**Test Case 6.1: Update character name and description**

```bash
PUT http://localhost:5001/api/themes/characters/CHARACTER_ID
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Updated Character Name",
  "description": "Updated description"
}
```

**Expected Result**:

- Status: 200
- Fields updated successfully

**Test Case 6.2: Update character image**

```bash
PUT http://localhost:5001/api/themes/characters/CHARACTER_ID
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

image=@path/to/new-image.png
```

**Expected Result**:

- Status: 200
- New image URL in response

**Test Case 6.3: Change character theme**

```bash
PUT http://localhost:5001/api/themes/characters/CHARACTER_ID
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "themeId": "DIFFERENT_THEME_ID"
}
```

**Expected Result**:

- Status: 200
- Character moved to new theme
- Theme validation passed

---

### 7. Theme Character - Delete (Chức năng 57)

**Test Case 7.1: Delete character**

```bash
DELETE http://localhost:5001/api/themes/characters/CHARACTER_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- Message: "Theme character deleted successfully"

**Test Case 7.2: Delete non-existent character**

```bash
DELETE http://localhost:5001/api/themes/characters/INVALID_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 404
- Error: "Theme character not found"

---

### 8. Theme Character - View/List (Chức năng 58)

**Test Case 8.1: Get all characters**

```bash
GET http://localhost:5001/api/themes/characters/list
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- All characters returned with pagination

**Test Case 8.2: Filter by theme**

```bash
GET http://localhost:5001/api/themes/characters/list?themeId=THEME_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Only characters of specified theme

**Test Case 8.3: Search characters**

```bash
GET http://localhost:5001/api/themes/characters/list?search=ninja
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Characters matching search term

**Test Case 8.4: Sort characters**

```bash
GET http://localhost:5001/api/themes/characters/list?sortBy=order&sortOrder=asc
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Characters sorted by order field

---

### 9. Theme Character - Detail (Chức năng 59)

**Test Case 9.1: Get character detail**

```bash
GET http://localhost:5001/api/themes/characters/CHARACTER_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- Full character details
- Theme info populated
- Creator info populated

**Test Case 9.2: Get non-existent character**

```bash
GET http://localhost:5001/api/themes/characters/INVALID_ID
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 404
- Error: "Theme character not found"

---

### 10. Statistics

**Test Case 10.1: Get theme statistics**

```bash
GET http://localhost:5001/api/themes/stats
Authorization: Bearer YOUR_TOKEN
```

**Expected Result**:

- Status: 200
- Total themes count
- Active themes count
- Published theme name
- Total characters count
- Top 5 popular themes

---

## Testing with Postman

### Import Collection

1. Create new Postman collection
2. Set collection variables:

   - `baseUrl`: http://localhost:5001
   - `token`: YOUR_AUTH_TOKEN
   - `themeId`: Test theme ID
   - `characterId`: Test character ID

3. Use `{{baseUrl}}`, `{{token}}` in requests

### Pre-request Script (for all requests)

```javascript
// Set token automatically
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.collectionVariables.get("token"),
});
```

---

## Testing with cURL

### Example: Create Theme

```bash
curl -X POST http://localhost:5001/api/themes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Theme",
    "description": "Testing",
    "colors": {
      "primary": "#FF0000"
    }
  }'
```

### Example: Upload with File

```bash
curl -X POST http://localhost:5001/api/themes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Theme" \
  -F "banner=@/path/to/image.jpg"
```

---

## Validation Checklist

### Theme Management

- [ ] Create theme với đầy đủ fields
- [ ] Create theme với minimal fields
- [ ] Duplicate name validation
- [ ] Update theme thành công
- [ ] Update với banner mới
- [ ] Delete theme không có characters
- [ ] Không thể delete theme có characters
- [ ] Không thể delete published theme
- [ ] Search themes hoạt động
- [ ] Sort by name, date, popularity
- [ ] Filter by isActive, isPublished
- [ ] Pagination đúng
- [ ] Apply theme (publish)
- [ ] Preview theme
- [ ] Chỉ 1 theme published tại 1 thời điểm
- [ ] Get active theme (public)
- [ ] Statistics đầy đủ

### Theme Character Management

- [ ] Create character với image
- [ ] Không thể create character không có image
- [ ] Validate theme exists
- [ ] Update character info
- [ ] Update character image
- [ ] Change character theme
- [ ] Delete character
- [ ] List all characters
- [ ] Filter characters by theme
- [ ] Search characters
- [ ] Sort characters
- [ ] Get character detail
- [ ] Character not found error

### File Upload

- [ ] Banner upload (max 10MB)
- [ ] Character image upload (max 5MB)
- [ ] Image file type validation
- [ ] File size limit enforcement

### Security

- [ ] Authentication required (except /active)
- [ ] Admin/Employee role required
- [ ] Customer cannot access

### Error Handling

- [ ] 404 for not found resources
- [ ] 400 for validation errors
- [ ] 401 for unauthorized
- [ ] 403 for forbidden
- [ ] 500 for server errors

---

## Common Issues & Solutions

### Issue 1: "Authentication required"

**Solution**: Make sure to include `Authorization: Bearer TOKEN` header

### Issue 2: "Theme not found"

**Solution**: Verify theme ID is correct and theme exists

### Issue 3: File upload fails

**Solution**:

- Check file size (banner max 10MB, character max 5MB)
- Check file type (only images)
- Use `multipart/form-data` content type

### Issue 4: Cannot delete theme

**Solution**:

- Check if theme has characters - delete them first
- Check if theme is published - unpublish it first

---

## Performance Testing

### Load Test: Get Themes with Pagination

```bash
# Test with different page sizes
for i in {1..10}; do
  curl "http://localhost:5001/api/themes?page=$i&limit=10" \
    -H "Authorization: Bearer TOKEN" \
    -w "\nTime: %{time_total}s\n"
done
```

### Bulk Character Creation

```bash
# Create multiple characters for a theme
for i in {1..20}; do
  curl -X POST http://localhost:5001/api/themes/characters \
    -H "Authorization: Bearer TOKEN" \
    -F "name=Character $i" \
    -F "themeId=THEME_ID" \
    -F "order=$i" \
    -F "image=@character.png"
done
```

---

## Automated Testing Script

```bash
#!/bin/bash

BASE_URL="http://localhost:5001"
TOKEN="YOUR_TOKEN"

echo "Testing Theme Management API..."

# Test 1: Create Theme
echo "Test 1: Creating theme..."
THEME_ID=$(curl -s -X POST "$BASE_URL/api/themes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Theme '$(date +%s)'"}' \
  | jq -r '.data._id')
echo "Created theme: $THEME_ID"

# Test 2: Get Theme
echo "Test 2: Getting theme..."
curl -s "$BASE_URL/api/themes/$THEME_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test 3: Update Theme
echo "Test 3: Updating theme..."
curl -s -X PUT "$BASE_URL/api/themes/$THEME_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated"}' | jq

# Test 4: Apply Theme
echo "Test 4: Applying theme..."
curl -s -X POST "$BASE_URL/api/themes/$THEME_ID/apply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preview":true}' | jq

# Test 5: Get Active Theme
echo "Test 5: Getting active theme..."
curl -s "$BASE_URL/api/themes/active" | jq

echo "All tests completed!"
```

Save as `test-themes.sh` and run: `bash test-themes.sh`
