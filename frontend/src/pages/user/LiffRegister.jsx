import { useEffect, useState } from "react";

const LINE_OA_URL = "https://line.me/R/ti/p/@460oucyj";
const LIFF_URL = "https://liff.line.me/2010145710-AI6zW4yo";

export default function LiffRegister() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step === 2) {
      window.location.href = LIFF_URL;
    }
  }, [step]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f0f0f0",
      padding: 16
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 360,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#06C755", marginBottom: 8 }}>ผูกบัญชี LINE</h2>

        {step === 1 && (
          <>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
              กรุณาเพิ่มเพื่อน LINE Official Account ก่อน
              แล้วกดปุ่มผูกบัญชี
            </p>
            <a
              href={LINE_OA_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "12px",
                backgroundColor: "#06C755",
                color: "#fff",
                borderRadius: 8,
                fontSize: 16,
                textDecoration: "none",
                marginBottom: 12
              }}
            >
              เพิ่มเพื่อน LINE
            </a>
            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#fff",
                color: "#06C755",
                border: "2px solid #06C755",
                borderRadius: 8,
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              ผูกบัญชีแล้ว / ผูกบัญชี
            </button>
          </>
        )}

        {step === 2 && (
          <p style={{ color: "#06C755", fontSize: 16 }}>กำลังเปิด LINE...</p>
        )}
      </div>
    </div>
  );
}