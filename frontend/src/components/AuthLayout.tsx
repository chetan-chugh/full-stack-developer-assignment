import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="brand-name">
          <span className="brand-mark" />
          Assignment App
        </div>

        <div>
          <h2>Talk to the bot. Run the team.</h2>
          <p>One account for the chatbot, plus a control room where admins manage people and review activity.</p>
        </div>

        <div className="demo-chat" aria-hidden="true">
          <div className="demo-bubble me">How do I pause a teammate's access?</div>
          <div className="demo-bubble bot">Open Users, then choose Deactivate. It applies immediately.</div>
        </div>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}