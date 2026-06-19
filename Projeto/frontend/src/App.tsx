import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MessageToastContainer } from "./components/MessageToastContainer";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { paths } from "./routes/paths";

export default function App() {
  return (
    <BrowserRouter>
      <MessageToastContainer />
      <Routes>
        <Route
          path={paths.home}
          element={<Navigate to={paths.register} replace />}
        />
        <Route path={paths.register} element={<RegisterPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        {/* Redirecionamentos a partir de URLs antigas em português */}
        <Route path="/cadastro" element={<Navigate to={paths.register} replace />} />
        <Route path="/entrar" element={<Navigate to={paths.login} replace />} />
        <Route
          path="*"
          element={<Navigate to={paths.register} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
