const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
  body: JSON.stringify({ name: "Teste", email: "teste@teste.com", password: "teste123" }),
});
const data = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(data, null, 2));
process.exit(0);
