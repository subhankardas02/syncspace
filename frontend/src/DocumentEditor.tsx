
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./DocumentEditor.css";

type Props = {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onBack: () => void;
};

export default function DocumentEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onBack,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "editor-content",
        spellcheck: "true",
      },
    },
  });

  return (
    <div className="editor-page">
      <header className="editor-topbar">
        <button className="back-button" onClick={onBack}>
          ← Back to documents
        </button>
        <span className="save-status">Saved in this session's browser</span>
      </header>

      <main className="editor-main">
        <input
          className="document-title-input"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled document"
          aria-label="Document title"
        />

        <div className="editor-toolbar">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
            className={editor?.isActive("bold") ? "active" : ""}
          >
            Bold
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
            className={editor?.isActive("italic") ? "active" : ""}
          >
            Italic
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
            className={editor?.isActive("bulletList") ? "active" : ""}
          >
            Bullet list
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor}
            className={editor?.isActive("heading", { level: 2 }) ? "active" : ""}
          >
            Heading
          </button>
        </div>

        <div className="editor-paper">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}
