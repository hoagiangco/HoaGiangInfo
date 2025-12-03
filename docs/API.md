# API Documentation

## Base URL

Development: `http://localhost:3000/api`

## Authentication

### Admin APIs
Require admin session cookie. Login at `/api/admin/login`.

### QR-based APIs
Some APIs require `token` query parameter to check module access.

## Endpoints

### QR Code

#### Verify QR Token
```
GET /api/qr/[token]
```

Response:
```json
{
  "id": "clxxx",
  "name": "Guest QR Code",
  "token": "guest-2024",
  "type": "guest",
  "isActive": true,
  "modules": ["menu", "room-service", "floor-plan", "services", "information"]
}
```

#### List QR Codes (Admin)
```
GET /api/qr
```

#### Create QR Code (Admin)
```
POST /api/qr
Content-Type: application/json

{
  "name": "New QR Code",
  "token": "new-token",
  "description": "Description",
  "type": "custom",
  "isActive": true
}
```

#### Update QR Code (Admin)
```
PUT /api/qr/[id]
Content-Type: application/json

{
  "name": "Updated Name",
  "token": "updated-token",
  "isActive": false
}
```

#### Delete QR Code (Admin)
```
DELETE /api/qr/[id]
```

#### Get QR Code Modules (Admin)
```
GET /api/qr/[id]/modules
```

#### Assign Module to QR Code (Admin)
```
POST /api/qr/[id]/modules
Content-Type: application/json

{
  "moduleId": "clxxx"
}
```

#### Remove Module from QR Code (Admin)
```
DELETE /api/qr/[id]/modules?moduleId=clxxx
```

### Modules

#### List Modules
```
GET /api/modules
```

Response:
```json
[
  {
    "id": "clxxx",
    "name": "menu",
    "displayName": "Menu Nhà Hàng",
    "description": "Xem menu nhà hàng",
    "icon": "🍽️",
    "route": "/menu",
    "isPublic": false
  }
]
```

#### Create Module (Admin)
```
POST /api/modules
Content-Type: application/json

{
  "name": "new-module",
  "displayName": "New Module",
  "description": "Description",
  "icon": "📋",
  "route": "/new-module",
  "isPublic": false
}
```

### Menu

#### List Menus
```
GET /api/menu
```

#### Create Menu (Admin)
```
POST /api/menu
Content-Type: application/json

{
  "name": "Breakfast Menu",
  "description": "Breakfast items",
  "category": "restaurant"
}
```

### Menu Items

#### List Menu Items
```
GET /api/menu-items?menuId=clxxx
```

#### Create Menu Item (Admin)
```
POST /api/menu-items
Content-Type: application/json

{
  "menuId": "clxxx",
  "name": "Pho Bo",
  "description": "Vietnamese beef noodle soup",
  "price": 150000,
  "category": "main",
  "image": "/images/pho.jpg"
}
```

### Services

#### List Services
```
GET /api/services
```

#### Create Service (Admin)
```
POST /api/services
Content-Type: application/json

{
  "name": "Swimming Pool",
  "type": "pool",
  "description": "Outdoor swimming pool",
  "hours": "06:00 - 22:00",
  "location": "Ground floor",
  "images": ["/images/pool1.jpg"]
}
```

### Information

#### List Information
```
GET /api/information
```

#### Create Information (Admin)
```
POST /api/information
Content-Type: application/json

{
  "category": "wifi",
  "title": "WiFi Password",
  "content": "Password: Resort2024!",
  "icon": "📶",
  "order": 1
}
```

### Technical Documents

#### List Documents
```
GET /api/technical-documents?token=staff-2024
```

Requires `technical` module access.

#### Upload Document (Admin)
```
POST /api/technical-documents
Content-Type: multipart/form-data

title: "Maintenance Guide"
category: "maintenance"
description: "Guide for maintenance"
file: [PDF file]
```

#### Get Document
```
GET /api/technical-documents/[id]
```

#### Update Document (Admin)
```
PUT /api/technical-documents/[id]
Content-Type: application/json

{
  "title": "Updated Title",
  "category": "safety",
  "isActive": true
}
```

#### Delete Document (Admin)
```
DELETE /api/technical-documents/[id]
```

### Admin

#### Login
```
POST /api/admin/login
Content-Type: application/json

{
  "password": "admin123"
}
```

#### Logout
```
POST /api/admin/logout
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error







