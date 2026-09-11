async function testRegister() {
  const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      name: "Teste Admin 2",
      email: "teste2@admin.com",
      password: "123456",
    }),
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

testRegister().catch(console.error);
