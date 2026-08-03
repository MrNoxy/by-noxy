import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import IntroAnimation from "./components/IntroAnimation";
import Home from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthProvider, ProtectedRoute } from "./lib/useAuth";
import { useSiteConfig } from "./lib/useSiteConfig";
import { applyTheme, getTheme } from "./lib/themes";

const INTRO_SESSION_KEY = "noxy-intro-shown";

export default function App() {
  const { config } = useSiteConfig();
  const [introDone, setIntroDone] = useState(() => sessionStorage.getItem(INTRO_SESSION_KEY) === "1");
  const [showIntro] = useState(() => sessionStorage.getItem(INTRO_SESSION_KEY) !== "1");

  useEffect(() => {
    applyTheme(getTheme(config.themeId));
  }, [config.themeId]);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setIntroDone(true);
  };

  return (
    <AuthProvider>
      {showIntro && !introDone && (
        <IntroAnimation name={config.name} onComplete={handleIntroComplete} />
      )}
      <Routes>
        <Route path="/" element={<Home introDone={introDone} />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
