import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 서비스 워커 캐시 강제 갱신
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.update());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
