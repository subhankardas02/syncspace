
import { useState } from "react";
import "./AuthPage.css";

interface AuthPageProps {
    onLogin: (token: string, email: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isRegister ? "register" : "login";

            const response = await fetch(
                `http://localhost:8080/api/auth/${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Authentication failed");
            }

            if (isRegister) {
                setIsRegister(false);
                setPassword("");
                setError("");
                alert("Account created successfully! Please log in.");
                return;
            }

            onLogin(data.token, data.email);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="brand-icon">S</div>
                    <h1>SyncSpace</h1>
                </div>

                <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
                <p className="auth-subtitle">
                    {isRegister
                        ? "Start your collaborative workspace."
                        : "Sign in to your workspace."}
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        minLength={8}
                        required
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : isRegister
                            ? "Create account"
                            : "Sign in"}
                    </button>
                </form>

                <p className="auth-switch">
                    {isRegister
                        ? "Already have an account?"
                        : "Don't have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError("");
                        }}
                    >
                        {isRegister ? "Sign in" : "Register"}
                    </button>
                </p>
            </div>
        </div>
    );
}
