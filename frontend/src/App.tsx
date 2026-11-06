
import { useEffect, useRef, useState } from "react";
import DocumentEditor from "./DocumentEditor";
import AuthPage from "./AuthPage";
import {
  getDocuments,
  createDocument as createDocumentAPI,
  updateDocument as updateDocumentAPI,
  deleteDocument,
  type Document,
} from "./services/documentService";
import "./App.css";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("syncspace_token")
  );

  const [userEmail, setUserEmail] = useState<string | null>(
    localStorage.getItem("syncspace_email")
  );

  // Keep track of pending save timers.
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Handle successful login.
  function handleLogin(token: string, email: string) {
    localStorage.setItem("syncspace_token", token);
    localStorage.setItem("syncspace_email", email);

    setToken(token);
    setUserEmail(email);
    setLoading(true);
    setError("");
  }

  // Handle logout.
  function handleLogout() {
    localStorage.removeItem("syncspace_token");
    localStorage.removeItem("syncspace_email");

    setToken(null);
    setUserEmail(null);
    setDocuments([]);
    setActiveId(null);
    setLoading(false);
    setError("");

    Object.values(saveTimers.current).forEach(clearTimeout);
    saveTimers.current = {};
  }

  // Load documents whenever the user logs in.
  useEffect(() => {
    if (!token) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    async function loadDocuments() {
      try {
        setError("");
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        setError(
          "Could not load documents. Please check your login and backend."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [token]);

  const activeDocument = documents.find((doc) => doc.id === activeId);

  // Create a document in PostgreSQL.
  const createDocument = async () => {
    try {
      setError("");

      const newDocument = await createDocumentAPI(
        "Untitled document",
        "<p>Start writing here...</p>"
      );

      setDocuments((previous) => [newDocument, ...previous]);
      setActiveId(newDocument.id);
    } catch (err) {
      setError("Could not create the document.");
    }
  };

  // Delete a document.
  const handleDeleteDocument = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) return;

    try {
      await deleteDocument(id);

      setDocuments((previous) =>
        previous.filter((doc) => doc.id !== id)
      );

      setError("");
    } catch (err) {
      setError("Could not delete the document.");
    }
  };

  // Update document locally and save after 700ms.
  const updateDocument = (
    id: number,
    changes: Partial<Pick<Document, "title" | "content">>
  ) => {
    const currentDocument = documents.find((doc) => doc.id === id);
    if (!currentDocument) return;

    const updatedDocument = { ...currentDocument, ...changes };

    setDocuments((previous) =>
      previous.map((doc) =>
        doc.id === id ? updatedDocument : doc
      )
    );

    const existingTimer = saveTimers.current[id];

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    saveTimers.current[id] = setTimeout(async () => {
      try {
        await updateDocumentAPI(
          id,
          updatedDocument.title,
          updatedDocument.content
        );
        setError("");
      } catch (err) {
        setError("Could not save changes. Please check your backend.");
      }
    }, 700);
  };

  // Show login/register page when logged out.
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Show loading screen.
  if (loading) {
    return <div className="app">Loading your documents...</div>;
  }

  // Show document editor.
  if (activeDocument) {
    return (
      <>
        {error && <p className="error-message">{error}</p>}

        <DocumentEditor
          key={activeDocument.id}
          documentId={activeDocument.id}
          userName={userEmail ?? "Anonymous"}
          title={activeDocument.title}
          content={activeDocument.content}
          onTitleChange={(title) =>
            updateDocument(activeDocument.id, { title })
          }
          onContentChange={(content) =>
            updateDocument(activeDocument.id, { content })
          }
          onBack={() => setActiveId(null)}
        />
      </>
    );
  }

  // Show dashboard.
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>SyncSpace</span>
        </div>

        <div className="profile-section">
          <span className="user-email">{userEmail}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main">
        <section className="welcome">
          <p className="eyebrow">YOUR SPACE TO CREATE TOGETHER</p>
          <h1>Good ideas start here.</h1>
          <p className="subtitle">
            Create documents, organize your thoughts, and collaborate in real time.
          </p>

          <button className="create-button" onClick={createDocument}>
            <span>+</span> Create document
          </button>
        </section>

        {error && <p className="error-message">{error}</p>}

        <section className="documents">
          <div className="section-heading">
            <h2>My documents</h2>
            <span>{documents.length} documents</span>
          </div>

          <div className="document-grid">
            {documents.map((document) => (
              <article className="document-card" key={document.id}>
                <div className="document-icon">▤</div>

                <h3>{document.title}</h3>

                <p>
                  Edited {new Date(document.updatedAt).toLocaleString()}
                </p>

                <div className="document-actions">
                  <button
                    className="open-button"
                    onClick={() => setActiveId(document.id)}
                  >
                    Open document →
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>SyncSpace · Think together, create together.</footer>
    </div>
  );
}

export default App;
