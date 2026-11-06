
const API_URL = "http://localhost:8080/api/documents";

export interface Document {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// Automatically attach JWT to every document API request.
function getAuthHeaders() {
    const token = localStorage.getItem("syncspace_token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// Get all documents belonging to the logged-in user.
export async function getDocuments(): Promise<Document[]> {
    const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch documents");
    }

    return response.json();
}

// Create a new document.
export async function createDocument(
    title: string,
    content: string
): Promise<Document> {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
        throw new Error("Failed to create document");
    }

    return response.json();
}

// Update an existing document.
export async function updateDocument(
    id: number,
    title: string,
    content: string
): Promise<Document> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
        throw new Error("Failed to update document");
    }

    return response.json();
}

// Delete a document.
export async function deleteDocument(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to delete document");
    }
}


export async function shareDocument(
    documentId: number,
    email: string,
    permission: "EDITOR" | "VIEWER"
): Promise<{ message: string; email: string; permission: string }> {

    const response = await fetch(
        `${API_URL}/${documentId}/shares`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                email,
                permission,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to share document"
        );
    }

    return data;
}
