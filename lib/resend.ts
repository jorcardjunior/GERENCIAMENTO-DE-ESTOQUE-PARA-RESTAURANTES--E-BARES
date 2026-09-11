type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const resend = {
  emails: {
    send: async (payload: EmailPayload) => {
      if (!RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY não configurada. Email não enviado.");
        console.info("📧 Email que seria enviado:", payload);
        return;
      }
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error("Erro Resend:", err);
        }
      } catch (err) {
        console.error("Falha ao enviar email:", err);
      }
    },
  },
};
