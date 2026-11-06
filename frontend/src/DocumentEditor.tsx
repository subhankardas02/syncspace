
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { shareDocument } from "./services/documentService";
import "./DocumentEditor.css";

type Props = {
    documentId: number;
    userName: string;
    title: string;
    content: string;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onBack: () => void;
};

type ActiveUser = {
    name: string;
    color: string;
};

export default function DocumentEditor({
    documentId,
    userName,
    title,
    content,
    onTitleChange,
    onContentChange,
    onBack,
}: Props) {
    const ydoc = useMemo(() => new Y.Doc(), [documentId]);

    const provider = useMemo(
        () =>
            new WebsocketProvider(
                "ws://localhost:1234",
                `syncspace-document-${documentId}`,
                ydoc
            ),
        [documentId, ydoc]
    );

    const [connected, setConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

    // Share panel state
    const [showShare, setShowShare] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePermission, setSharePermission] =
        useState<"EDITOR" | "VIEWER">("EDITOR");
    const [sharing, setSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState("");
    const [shareError, setShareError] = useState("");

    // WebSocket connection and active users
    useEffect(() => {
        const handleStatus = (event: { status: string }) => {
            setConnected(event.status === "connected");
        };

        const updateActiveUsers = () => {
            const states = Array.from(
                provider.awareness.getStates().values()
            );

            const users = states
                .map((state: any) => state.user)
                .filter(
                    (user): user is ActiveUser =>
                        Boolean(user && user.name)
                );

            setActiveUsers(users);
        };

        provider.on("status", handleStatus);
        provider.awareness.on("change", updateActiveUsers);

        updateActiveUsers();

        return () => {
            provider.off("status", handleStatus);
            provider.awareness.off("change", updateActiveUsers);
            provider.destroy();
            ydoc.destroy();
        };
    }, [provider, ydoc]);

    // Set current user's information
    useEffect(() => {
        provider.awareness.setLocalStateField("user", {
            name: userName,
            color: "#7c3aed",
        });
    }, [provider, userName]);

    // Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                undoRedo: false,
            }),

            Collaboration.configure({
                document: ydoc,
            }),

            CollaborationCaret.configure({
                provider,
                user: {
                    name: userName,
                    color: "#7c3aed",
                },
            }),
        ],

        editorProps: {
            attributes: {
                class: "editor-content",
                spellcheck: "false",
            },
        },

        onUpdate: ({ editor }) => {
            onContentChange(editor.getHTML());
        },
    });

    // Share document
    async function handleShare() {
        if (!shareEmail.trim()) {
            setShareError("Enter your friend's email address.");
            return;
        }

        setSharing(true);
        setShareError("");
        setShareMessage("");

        try {
            const result = await shareDocument(
                documentId,
                shareEmail.trim(),
                sharePermission
            );

            setShareMessage(
                `Shared with ${result.email} as ${result.permission}.`
            );

            setShareEmail("");

            // Close panel after successful sharing
            setShowShare(false);
        } catch (error) {
            setShareError(
                error instanceof Error
                    ? error.message
                    : "Could not share document."
            );
        } finally {
            setSharing(false);
        }
    }

    return (
        <div className="editor-page">

            {/* Top navigation */}
            <header className="editor-topbar">

                <button
                    className="back-button"
                    onClick={onBack}
                >
                    ← Back
                </button>

                <div className="save-status">
                    <span
                        className={
                            connected
                                ? "connection-dot connected"
                                : "connection-dot disconnected"
                        }
                    />
                    {connected ? "Connected" : "Connecting..."}
                </div>

                {/* Active users */}
                <div className="active-users">
                    {activeUsers.map((user, index) => (
                        <div
                            key={`${user.name}-${index}`}
                            className="active-user"
                            style={{
                                backgroundColor: user.color,
                            }}
                            title={user.name}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                </div>

                {/* Share button */}
                <button
                    className="share-button"
                    onClick={() => {
                        setShowShare(!showShare);
                        setShareError("");
                        setShareMessage("");
                    }}
                >
                    Share
                </button>

            </header>

            {/* Share panel */}
            {showShare && (
                <div className="share-panel">

                    <div className="share-panel-header">
                        <h3>Share document</h3>

                        <button
                            className="share-close-button"
                            onClick={() => setShowShare(false)}
                        >
                            ×
                        </button>
                    </div>

                    <p>
                        Invite someone to collaborate on this document.
                    </p>

                    <input
                        type="email"
                        className="share-email-input"
                        placeholder="Enter email address"
                        value={shareEmail}
                        onChange={(event) =>
                            setShareEmail(event.target.value)
                        }
                    />

                    <select
                        className="share-permission-select"
                        value={sharePermission}
                        onChange={(event) =>
                            setSharePermission(
                                event.target.value as "EDITOR" | "VIEWER"
                            )
                        }
                    >
                        <option value="EDITOR">
                            Editor - Can edit document
                        </option>

                        <option value="VIEWER">
                            Viewer - Can only view document
                        </option>
                    </select>

                    <button
                        className="share-submit-button"
                        onClick={handleShare}
                        disabled={sharing}
                    >
                        {sharing ? "Sharing..." : "Share document"}
                    </button>

                    {shareMessage && (
                        <p className="share-success">
                            {shareMessage}
                        </p>
                    )}

                    {shareError && (
                        <p className="share-error">
                            {shareError}
                        </p>
                    )}

                </div>
            )}

            {/* Editor area */}
            <main className="editor-main">

                {/* Document title */}
                <input
                    className="document-title-input"
                    type="text"
                    value={title}
                    onChange={(event) =>
                        onTitleChange(event.target.value)
                    }
                    placeholder="Untitled document"
                />

                {/* Formatting toolbar */}
                {editor && (
                    <div className="editor-toolbar">

                        <button
                            title="Bold"
                            onClick={() =>
                                editor.chain().focus().toggleBold().run()
                            }
                            className={
                                editor.isActive("bold") ? "is-active" : ""
                            }
                        >
                            <strong>B</strong>
                        </button>

                        <button
                            title="Italic"
                            onClick={() =>
                                editor.chain().focus().toggleItalic().run()
                            }
                            className={
                                editor.isActive("italic") ? "is-active" : ""
                            }
                        >
                            <em>I</em>
                        </button>

                        <button
                            title="Strikethrough"
                            onClick={() =>
                                editor.chain().focus().toggleStrike().run()
                            }
                            className={
                                editor.isActive("strike") ? "is-active" : ""
                            }
                        >
                            <s>S</s>
                        </button>

                        <span className="toolbar-divider" />

                        <button
                            title="Bullet list"
                            onClick={() =>
                                editor.chain().focus().toggleBulletList().run()
                            }
                            className={
                                editor.isActive("bulletList")
                                    ? "is-active"
                                    : ""
                            }
                        >
                            ☷
                        </button>

                        <button
                            title="Numbered list"
                            onClick={() =>
                                editor.chain().focus().toggleOrderedList().run()
                            }
                            className={
                                editor.isActive("orderedList")
                                    ? "is-active"
                                    : ""
                            }
                        >
                            1.
                        </button>

                        <span className="toolbar-divider" />

                        <button
                            title="Heading 1"
                            onClick={() =>
                                editor.chain().focus()
                                    .toggleHeading({ level: 1 }).run()
                            }
                            className={
                                editor.isActive("heading", { level: 1 })
                                    ? "is-active"
                                    : ""
                            }
                        >
                            H1
                        </button>

                        <button
                            title="Heading 2"
                            onClick={() =>
                                editor.chain().focus()
                                    .toggleHeading({ level: 2 }).run()
                            }
                            className={
                                editor.isActive("heading", { level: 2 })
                                    ? "is-active"
                                    : ""
                            }
                        >
                            H2
                        </button>

                        <span className="toolbar-divider" />

                        <button
                            title="Undo"
                            onClick={() =>
                                editor.chain().focus().undo().run()
                            }
                        >
                            ↶
                        </button>

                        <button
                            title="Redo"
                            onClick={() =>
                                editor.chain().focus().redo().run()
                            }
                        >
                            ↷
                        </button>

                    </div>
                )}

                {/* Document paper */}
                <div className="editor-paper">
                    <EditorContent editor={editor} />
                </div>

            </main>
        </div>
    );
}
