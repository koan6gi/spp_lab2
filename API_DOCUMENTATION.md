# REST API Specification & Architecture Documentation

## 1. Overview
This document specifies the REST API schema, payload formats, update semantics, and reactive client state management for the Minimalist Notes Application.

The backend exposes a RESTful API over HTTP, supporting both `application/json` and `multipart/form-data` requests. Uploaded images are stored in a persistent local directory and served statically under `/uploads/`.

---

## 2. Database Schema (PostgreSQL)

Single table `notes`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, default `gen_random_uuid()` | Unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL` | Required note title |
| `text` | `TEXT` | `NULL` | Optional body content |
| `image_url` | `VARCHAR(500)` | `NULL` | Relative URL to image file (e.g. `/uploads/abc.png`) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of creation |

---

## 3. Endpoints & Payloads

### 3.1 Fetch All Notes
- **Endpoint**: `GET /api/notes`
- **Description**: Returns all notes, ordered by `created_at` descending.
- **Request Headers**: None required
- **Request Body**: None
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": "c71a3962-d24e-4b2a-89f5-1b48b6c43df6",
        "title": "Grocery list",
        "text": "Milk, eggs, sourdough bread",
        "image_url": "/uploads/1742813400000-123456789.png",
        "created_at": "2026-09-21T10:45:00.000Z"
      }
    ]
    ```
  - `500 Internal Server Error`:
    ```json
    { "error": "Internal server error." }
    ```

---

### 3.2 Create Note
- **Endpoint**: `POST /api/notes`
- **Description**: Creates a new note with required `title`, optional `text`, and optional single `image` file.
- **Content Types Supported**:
  1. `multipart/form-data` (when uploading an image file):
     - `title`: string (Required, non-empty)
     - `text`: string (Optional)
     - `image`: binary file (Optional, restricted to 1 image file)
  2. `application/json` (when no image file is being uploaded):
     - Payload:
       ```json
       {
         "title": "Buy concert tickets",
         "text": "Sale starts Friday at 10 AM"
       }
       ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "id": "e9b2518e-4a65-4f32-8419-4809cb9f8481",
      "title": "Buy concert tickets",
      "text": "Sale starts Friday at 10 AM",
      "image_url": null,
      "created_at": "2026-09-21T10:50:00.000Z"
    }
    ```
  - `400 Bad Request` (Missing or empty title, or invalid file type):
    ```json
    { "error": "Title is required and cannot be empty." }
    ```
  - `500 Internal Server Error`:
    ```json
    { "error": "Internal server error." }
    ```

---

### 3.3 Update Note
- **Endpoint**: `PUT /api/notes/:id`
- **Description**: Updates an existing note. Receives the **entire form state**.
- **Content Types Supported**:
  1. `multipart/form-data` (used when attaching a new file or modifying image status):
     - `title`: string (Required)
     - `text`: string (Optional)
     - `image`: binary file (Optional, replaces existing image)
     - `remove_image`: string `"true"` (Optional, signals deletion of existing image)
  2. `application/json`:
     - Payload:
       ```json
       {
         "title": "Updated Title",
         "text": "Updated content...",
         "remove_image": true
       }
       ```

#### Image Update Logic Matrix
The server evaluates image changes using the following precedence:

| Scenario | Request Parameters | Server Action |
| :--- | :--- | :--- |
| **1. Replace Image** | `image` file attached in `req.file` | Deletes existing image file from `/uploads` (if any). Saves new file to `/uploads` and sets `image_url = '/uploads/' + filename`. |
| **2. Remove Image** | `remove_image === 'true'` or `remove_image === true` | Deletes existing image file from `/uploads` (if any). Sets `image_url = null`. |
| **3. Keep Existing** | No file attached AND no `remove_image` flag | Retains the existing `image_url` intact without touching disk files. |

- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": "e9b2518e-4a65-4f32-8419-4809cb9f8481",
      "title": "Updated Title",
      "text": "Updated content...",
      "image_url": "/uploads/1742813500000-987654321.jpg",
      "created_at": "2026-09-21T10:50:00.000Z"
    }
    ```
  - `400 Bad Request` (Title missing / empty):
    ```json
    { "error": "Title is required and cannot be empty." }
    ```
  - `404 Not Found` (Note ID does not exist):
    ```json
    { "error": "Note not found." }
    ```
  - `500 Internal Server Error`:
    ```json
    { "error": "Internal server error." }
    ```

---

### 3.4 Delete Note
- **Endpoint**: `DELETE /api/notes/:id`
- **Description**: Deletes a note by ID and removes any associated image file from disk.
- **Request Body**: None
- **Responses**:
  - `204 No Content` (Successfully deleted, empty response body)
  - `404 Not Found`:
    ```json
    { "error": "Note not found." }
    ```
  - `500 Internal Server Error`:
    ```json
    { "error": "Internal server error." }
    ```

---

## 4. Reactive Frontend Flow (In-Memory State Management)

The client performs all UI updates in memory without reloading the page or refetching all notes from the server (`GET /api/notes`).

```
+-------------------------------------------------------------+
|                     Client Action                          |
+-------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
[ Create Note ]        [ Edit Note ]          [ Delete Note ]
       |                      |                      |
       v                      v                      v
POST /api/notes       PUT /api/notes/:id     DELETE /api/notes/:id
       |                      |                      |
 201 Created            200 OK                 204 No Content
       |                      |                      |
       v                      v                      v
setNotes(prev =>       setNotes(prev =>       setNotes(prev =>
  [newNote, ...prev]     prev.map(note =>       prev.filter(note =>
)                          note.id === updated    note.id !== id
                           ? updated : note     )
                         )                    )
       |                      |                      |
       +----------------------+----------------------+
                              |
                              v
                  Toast Notification Displayed
               DOM re-renders instantly in memory
```

### Exact Array Operations
1. **Creation**:
   ```javascript
   const newNote = await createNote(payload);
   setNotes(prev => [newNote, ...prev]);
   ```
   *Places the new note at the top of the list because notes are ordered by `created_at DESC`.*

2. **Update**:
   ```javascript
   const updated = await updateNote(id, payload);
   setNotes(prev => prev.map(note => note.id === updated.id ? updated : note));
   ```
   *Replaces the updated note in-place, preserving its position in the list.*

3. **Deletion**:
   ```javascript
   await deleteNote(id);
   setNotes(prev => prev.filter(note => note.id !== id));
   ```
   *Filters out the deleted note from the active array.*

---

## 5. Error Handling & HTTP Status Code Matrix

| Status Code | Meaning | Context |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | `GET /api/notes`, `PUT /api/notes/:id` |
| `201 Created` | Resource created | `POST /api/notes` |
| `204 No Content` | Resource deleted | `DELETE /api/notes/:id` |
| `400 Bad Request` | Validation failure | Missing title, empty title, invalid file type, upload limit exceeded |
| `404 Not Found` | Resource missing | Attempting to update or delete a non-existent note ID |
| `500 Server Error` | Unhandled failure | Database connection failure, unexpected system fault |
