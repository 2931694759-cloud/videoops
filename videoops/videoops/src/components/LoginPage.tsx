"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

const BRAND_RED = "#e74c3c";

export default function LoginPage() {
  const login = useStore(s => s.login);
  const [email, setEmail] = useState("zhanglei@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(email, password);
    if (!ok) setError("邮箱或密码错误");
  };

  const inputStyle = { width: "100%", height: 42, padding: "0 14px", backgroundColor: "#ffffff", border: "1px solid #d0d0d6", borderRadius: 8, fontSize: 14, color: "#1a1a2e", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e8e8ec", borderRadius: 16, padding: "40px 36px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: BRAND_RED, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 12px rgba(231,76,60,0.3)" }}>
              <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>V</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.4px" }}>TheMIX Studio</h1>
            <p style={{ fontSize: 13, color: "#8a8a96", marginTop: 6 }}>视频制作部门任务管理系统</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#52525b", marginBottom: 6 }}>邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#52525b", marginBottom: 6 }}>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            </div>
            {error && <div style={{ color: BRAND_RED, fontSize: 12, backgroundColor: "rgba(231,76,60,0.08)", padding: "8px 12px", borderRadius: 6 }}>{error}</div>}
            <button type="submit" style={{ width: "100%", height: 44, backgroundColor: BRAND_RED, color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(231,76,60,0.3)", marginTop: 4 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >登录</button>
          </form>
        </div>
        <div style={{ marginTop: 16, padding: "14px 16px", backgroundColor: "#ffffff", borderRadius: 10, border: "1px solid #e8e8ec" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#8a8a96", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>演示账号</p>
          <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.8 }}>
            <p>组长: zhanglei@example.com</p>
            <p>组员: limei@example.com</p>
            <p style={{ color: "#8a8a96" }}>密码: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
