export default function TestePage() {
  return (
    <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#2563eb" }}>PÁGINA DE TESTE FUNCIONA!</h1>
      <p>Se você está vendo isso, o Next.js está funcionando perfeitamente.</p>
      <p>Problema está na landing page (page.tsx da raiz), não no Next.js.</p>
      <br />
      <a href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Voltar para Home
      </a>
      <br />
      <br />
      <a href="/auth/login" style={{ color: "green", textDecoration: "underline" }}>
        Ir para Login
      </a>
    </div>
  );
}
