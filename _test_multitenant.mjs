/**
 * Teste E2E do fluxo multi-tenant:
 *   cadastro (owner) → me → convite → ativação → login do convidado → me → /api/users
 *
 * Pré-requisitos:
 *   - Servidor dev rodando em http://localhost:3000 (npm run dev)
 *   - Banco acessível (DATABASE_URL)
 *
 * Uso: node _test_multitenant.mjs
 */
const BASE = "http://localhost:3000";
const stamp = Date.now();
const ownerEmail = `owner.mt+${stamp}@teste.com`;
const inviteEmail = `conv.mt+${stamp}@teste.com`;
const companyName = `Restaurante Teste ${stamp}`;
const PASSWORD = "teste12345";

let step = 0;
const ok = (msg) => console.log(`✅ [${step}] ${msg}`);
const fail = (msg, extra) => {
  console.error(`❌ [${step}] ${msg}`, extra ?? "");
  process.exit(1);
};

function getCookie(res, preferred = "better-auth.session_token") {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  // Pega todos os pares nome=valor e escolhe o token de sessão
  const cookies = raw.split(/,\s(?=[^;]+=)/i);
  const target = cookies.find((c) => c.startsWith(preferred + "="));
  if (target) {
    const value = target.split(";")[0];
    return value;
  }
  return null;
}

async function jws(res) {
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// ---------- 1. Cadastro do owner ----------
step = 1;
console.log("\n=== 1. Cadastro do owner ===");
const signUpRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ name: "Owner Teste", email: ownerEmail, password: PASSWORD }),
});
const signUpData = await jws(signUpRes);
if (!signUpRes.ok) fail("sign-up falhou", signUpData);
ok(`sign-up ok (user=${signUpData?.user?.id})`);

const ownerCookie = getCookie(signUpRes);
if (!ownerCookie) fail("cookie de sessão do owner não encontrado no sign-up");
ok("cookie de sessão capturado");

// ---------- 2. Provisionamento da empresa ----------
step = 2;
console.log("\n=== 2. Provisionar empresa (owner) ===");
const regRes = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: BASE,
    Cookie: ownerCookie,
  },
  body: JSON.stringify({ companyName }),
});
const regData = await jws(regRes);
if (!regRes.ok) fail("/api/auth/register falhou", regData);
ok(`empresa criada (companyId=${regData?.companyId}, role=${regData?.role})`);
const storedCompanyName = regData?.companyName; // valor real após normalização no servidor

// ---------- 3. GET /api/auth/me (owner) ----------
step = 3;
console.log("\n=== 3. /api/auth/me (owner) ===");
const meRes = await fetch(`${BASE}/api/auth/me`, {
  headers: { Cookie: ownerCookie, Origin: BASE },
});
const meData = await jws(meRes);
if (!meRes.ok) fail("/api/auth/me falhou", meData);
const meUser = meData?.user;
if (meUser?.role !== "owner") fail(`role esperado 'owner', veio '${meUser?.role}'`);
if (!meUser?.companyId) fail("companyId vazio após cadastro");
if (meUser?.company?.name !== storedCompanyName) {
  fail(`companyName esperado '${storedCompanyName}', veio '${meUser?.company?.name}'`);
}
ok(
  `owner autenticado: role=${meUser.role}, companyId=${meUser.companyId}, company=${meUser.company.name}`,
);

// ---------- 4. Criar convite ----------
step = 4;
console.log("\n=== 4. Criar convite (gerente) ===");
const invRes = await fetch(`${BASE}/api/invitations`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: ownerCookie, Origin: BASE },
  body: JSON.stringify({ name: "Convidado Teste", email: inviteEmail, role: "gerente" }),
});
const invData = await jws(invRes);
if (!invRes.ok) fail("/api/invitations POST falhou", invData);
const inviteUrl = invData?.inviteUrl;
if (!inviteUrl) fail("inviteUrl não retornado");
const token = new URL(inviteUrl).searchParams.get("token");
if (!token) fail("token ausente no inviteUrl");
ok(`convite criado (role=gerente), token=${token.slice(0, 8)}...`);

// ---------- 5. GET /api/auth/activate?token= ----------
step = 5;
console.log("\n=== 5. Validar convite (GET activate) ===");
const invGetRes = await fetch(`${BASE}/api/auth/activate?token=${encodeURIComponent(token)}`, {
  headers: { Origin: BASE },
});
const invGetData = await jws(invGetRes);
if (!invGetRes.ok) fail("/api/auth/activate GET falhou", invGetData);
if (invGetData?.invite?.email !== inviteEmail) fail("email do convite não bate", invGetData);
if (invGetData?.invite?.companyName !== storedCompanyName)
  fail("companyName do convite não bate", invGetData);
ok(`convite válido: email=${invGetData.invite.email}, company=${invGetData.invite.companyName}`);

// ---------- 6. Ativação do convidado ----------
step = 6;
console.log("\n=== 6. Ativar conta do convidado ===");
const actRes = await fetch(`${BASE}/api/auth/activate`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ token, name: "Convidado Teste", password: PASSWORD }),
});
const actData = await jws(actRes);
if (!actRes.ok) fail("/api/auth/activate POST falhou", actData);
ok("conta do convidado ativada");

// ---------- 7. Login do convidado ----------
step = 7;
console.log("\n=== 7. Login do convidado ===");
const signInRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ email: inviteEmail, password: PASSWORD }),
});
const signInData = await jws(signInRes);
if (!signInRes.ok) fail("sign-in do convidado falhou", signInData);
const memberCookie = getCookie(signInRes);
if (!memberCookie) fail("cookie de sessão do convidado não encontrado");
ok("login do convidado ok, cookie capturado");

// ---------- 8. /api/auth/me do convidado ----------
step = 8;
console.log("\n=== 8. /api/auth/me (convidado) ===");
const me2Res = await fetch(`${BASE}/api/auth/me`, {
  headers: { Cookie: memberCookie, Origin: BASE },
});
const me2Data = await jws(me2Res);
if (!me2Res.ok) fail("/api/auth/me do convidado falhou", me2Data);
const member = me2Data?.user;
if (member?.role !== "gerente") fail(`role esperado 'gerente', veio '${member?.role}'`);
if (member?.companyId !== meUser.companyId) {
  fail(`companyId do convidado (${member?.companyId}) != owner (${meUser.companyId})`);
}
ok(
  `convidado autenticado: role=${member.role}, companyId=${member.companyId} (mesmo tenant do owner)`,
);

// ---------- 9. Isolamento: /api/users só da empresa ----------
step = 9;
console.log("\n=== 9. Isolamento de tenant em /api/users ===");
const usersRes = await fetch(`${BASE}/api/users`, {
  headers: { Cookie: ownerCookie, Origin: BASE },
});
const usersData = await jws(usersRes);
if (!usersRes.ok) fail("/api/users falhou", usersData);
const emails = (usersData || []).map((u) => u.email);
if (!emails.includes(ownerEmail)) fail("owner não aparece na lista de membros", emails);
if (!emails.includes(inviteEmail)) fail("convidado não aparece na lista de membros", emails);
ok(`membros da empresa (${usersData.length}): ${emails.join(", ")}`);

console.log("\n🎉 TODOS OS PASSOS PASSARAM — fluxo multi-tenant OK.");
process.exit(0);
