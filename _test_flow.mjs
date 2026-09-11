const loginRes = await fetch("http://localhost:3000/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify({ email: "admin@admin.com", password: "admin123" }),
});
const data = await loginRes.json();
const token = data.token;
console.log("Login: OK, token:", token?.substring(0, 20));

// /api/auth/me with session cookie
const cookie = `better-auth-session=${token}`;
const meRes = await fetch("http://localhost:3000/api/auth/me", {
  headers: { Cookie: cookie, Origin: "http://localhost:3000" },
});
const meData = await meRes.json();
console.log("/api/auth/me:", JSON.stringify(meData));

process.exit(0);
