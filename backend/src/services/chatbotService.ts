// backend/src/services/chatbotService.ts
interface Rule {
  keywords: string[];
  pattern?: RegExp; // optional phrase match, e.g. /how are you/ (worth 2 points)
  reply: string | (() => string);
}

const RULES: Rule[] = [
  // --- Greetings & small talk ---
  { keywords: ["hello", "hi", "hey", "hola", "namaste"], reply: "Hello! How can I help you today?" },
  { keywords: ["morning"], reply: "Good morning! How can I help you today?" },
  { keywords: ["afternoon"], reply: "Good afternoon! How can I help you today?" },
  { keywords: ["evening"], reply: "Good evening! How can I help you today?" },
  { keywords: [], pattern: /how are you|how r u/, reply: "I'm just a bot, but I'm running fine. How can I help you?" },
  { keywords: [], pattern: /who are you|your name|what are you/, reply: "I'm the assistant for this app. I can answer basic questions about accounts, roles and security." },
  { keywords: ["bye", "goodbye", "thanks", "thank"], reply: "You are welcome! Goodbye." },

  // --- Help ---
  {
    keywords: ["help", "support", "assist", "options", "menu"],
    reply:
      'I can answer questions about: "how to use the website", "register", "login", "password", "profile", "delete account", "roles", "admin", "logs", "security", "session" and "logout".',
  },

  // --- How to use the website ---
  {
    keywords: ["website", "site", "used", "use", "using", "guide", "tutorial", "started", "usage"],
    pattern: /how (do|can|to|we|i).*(use|used|using)|get(ting)? started/,
    reply:
      'Here is how to use this website:\n1) Register with your name, email and a strong password, then log in.\n2) Open Chatbot from the left sidebar and type a question, or type "help" to see the topics I know.\n3) Open Profile to change your username, update your password, or delete your account.\n4) Use Logout in the sidebar when you are done. Admins also see Users and Usage Logs in the sidebar.',
  },

  // --- Registration & login ---
  { keywords: ["register", "signup", "sign", "create"], reply: "To register, open the Register page, enter your name, email and a strong password, then submit. You can then log in." },
  { keywords: ["login", "signin"], reply: "Open the Login page, enter your email and password. Regular users go to the Chatbot and admins go to the Users page." },
  { keywords: ["logout", "signout"], pattern: /log ?out|sign ?out/, reply: "Use the Logout button in the left sidebar. Your session is ended and you'll return to the Login page." },
  { keywords: ["email", "username"], reply: "Your email is your unique login ID and cannot be changed. You can change your username from the Profile page." },
  { keywords: ["verify", "verification", "otp"], reply: "This app does not use email verification or OTP. Registration only needs valid details." },

  // --- Password ---
  { keywords: ["forgot", "reset", "forget"], reply: "Password reset isn't self-service in this app. Please contact an administrator to reset your password." },
  { keywords: ["change", "update", "new"], reply: "Open Profile in the sidebar. You can change your username there, and use the Update Password tab to change your password. Admins can also update users from the Users page." },
  { keywords: ["strong", "requirements", "rules", "valid", "validation"], reply: "Use a strong password: at least 8 characters, with a letter and a number. Emails must be in a valid format." },
  { keywords: ["password", "passwords"], reply: "Passwords are hashed with bcrypt and are never stored in plain text. You can change yours from Profile > Update Password." },

  // --- Account & roles ---
  { keywords: ["account", "profile"], reply: "Open Profile in the sidebar to see and change your account details, update your password or delete your account." },
  { keywords: ["delete", "remove", "deactivate"], reply: "You can delete your own account from Profile. It deactivates your account and signs you out. Administrators can also deactivate accounts from the Users page." },
  { keywords: ["disabled", "blocked", "suspended", "locked"], reply: "If your account is disabled or blocked, an administrator has restricted it. Please contact them to restore access." },
  { keywords: ["role", "roles", "permission", "permissions", "access"], reply: "There are two roles: User (can log in and use the chatbot) and Admin (can also manage users and view usage logs)." },
  { keywords: ["user", "users"], reply: "Regular users can log in, use the chatbot and manage their own profile." },
  { keywords: ["admin", "administrator"], reply: "Administrators can manage users and view usage logs from the Users and Usage Logs pages in the sidebar." },
  { keywords: ["unauthorized", "forbidden", "denied"], reply: "You get this when you're not logged in or your role lacks permission. Log in again, or ask an admin if you need more access." },

  // --- Admin features ---
  { keywords: ["manage", "edit", "control"], reply: "Admins can view, edit, enable/disable and delete user accounts from the Users page." },
  { keywords: ["logs", "activity", "history", "audit"], reply: "Usage logs record events like registrations, logins, chatbot messages and admin actions. Admins can view them on the Usage Logs page." },
  { keywords: ["tracked", "track", "tracking", "monitor", "monitoring"], reply: "The app logs user activity (such as login and chat use) with a timestamp so admins can review usage." },

  // --- Security & sessions ---
  { keywords: ["security", "secure", "safe", "privacy", "data"], reply: "Passwords are hashed, protected routes require authentication, and admin features are restricted by role." },
  { keywords: ["session", "token", "jwt", "expire", "expired", "timeout"], reply: "You stay logged in using a secure token. When it expires, simply log in again." },
  { keywords: ["encrypt", "encryption", "hash", "bcrypt"], reply: "Passwords are hashed with bcrypt before they are saved. Plain-text passwords are never stored." },

  // --- About the app / chatbot ---
  { keywords: ["chatbot", "chat", "work", "works"], reply: "I'm a rule-based chatbot: I match keywords in your message to prepared answers. Only logged-in users can use me." },
  { keywords: ["ai", "gpt", "openai", "llm"], reply: "I'm not powered by an external AI service. I use prepared, rule-based answers." },
  { keywords: ["app", "application", "about", "features", "feature"], reply: "This app provides registration, role-based login, this chatbot, profile management, an admin user-management panel and usage logging." },
  { keywords: ["technology", "tech", "stack", "built"], reply: "The backend is built with Node.js and TypeScript. Ask an admin or check the README for the full stack." },
  { keywords: ["database", "db", "stored", "store"], reply: "User accounts and usage logs are stored in the application's database." },
  { keywords: ["contact", "reach"], reply: "For issues I can't solve, please contact your administrator." },
  { keywords: ["cost", "price", "free", "pricing"], reply: "This is an assignment project, so there is no cost involved." },
  { keywords: ["error", "bug", "problem", "issue", "broken"], reply: "Sorry about that! Try refreshing and logging in again. If it continues, please report it to an administrator." },

  // --- Utilities ---
  { keywords: ["time", "date", "today", "now"], reply: () => `The server time is ${new Date().toLocaleString()}.` },
  { keywords: ["day"], reply: () => `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long" })}.` },
  { keywords: ["joke"], reply: "Why do programmers prefer dark mode? Because light attracts bugs." },
];

const FALLBACK =
  'Sorry, I did not understand that. Type "help" to see what I can do.';

export function getReply(message: string): string {
  // "Hello there!" -> ["hello", "there"]
  const text = message.toLowerCase();
  const words = new Set<string>(text.match(/[a-z]+/g) ?? []);

  // Pick the rule with the MOST keyword matches (ties: earliest rule wins),
  // so "I forgot my password" beats the generic "password" rule.
  let best: Rule | undefined;
  let bestScore = 0;
  for (const rule of RULES) {
    const score =
      rule.keywords.filter((k) => words.has(k)).length +
      (rule.pattern?.test(text) ? 2 : 0);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }

  if (!best) return FALLBACK;
  return typeof best.reply === "function" ? best.reply() : best.reply;
}