
import { useEffect, useState } from "react";
import DocumentEditor from "./DocumentEditor";
import "./App.css";

type DocumentItem = {
  id: number;
  title: string;
  content: string;
  updated: string;
};

const STORAGE_KEY = "syncspace-documents";

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    title: "Welcome to SyncSpace",
    content: "<h2>Welcome!</h2><p>Start writing your ideas here.</p>",
    updated: "Just now",
  },
  {
    id: 2,
    title: "Project Planning",
    content: "<h2>Project plan</h2><p>Write your next big idea here.</p>",
    updated: "Yesterday",
  },
];

function loadDocuments(): DocumentItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as DocumentItem[] : initialDocuments;
  } catch {
    return initialDocuments;
  }
}

function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>(loadDocuments);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  const activeDocument = documents.find((doc) => doc.id === activeId);

  const createDocument = () => {
    const newDocument: DocumentItem = {
      id: Date.now(),
      title: "Untitled document",
      content: "<p>Start writing here...</p>",
      updated: "Just now",
    };
    setDocuments((previous) => [newDocument, ...previous]);
    setActiveId(newDocument.id);
  };

  const updateDocument = (id: number, changes: Partial<DocumentItem>) => {
    setDocuments((previous) =>
      previous.map((doc) =>
        doc.id === id ? { ...doc, ...changes, updated: "Just now" } : doc
      )
    );
  };

  if (activeDocument) {
    return (
      <DocumentEditor
        key={activeDocument.id}
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
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>SyncSpace</span>
        </div>
        <div className="user-avatar">S</div>
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
                <p>Edited {document.updated}</p>
                <button
                  className="open-button"
                  onClick={() => setActiveId(document.id)}
                >
                  Open document →
                </button>
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
