import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MessageToastContainer } from "./components/MessageToastContainer";
import { ConfirmDialogContainer } from "./components/ConfirmDialogContainer";
import { RequireAuth } from "./components/RequireAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { CategoriasPage } from "./pages/CategoriasPage";
import { FornecedoresPage } from "./pages/FornecedoresPage";
import { MovimentacoesPage } from "./pages/MovimentacoesPage";
import { ProdutosPage } from "./pages/ProdutosPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { paths } from "./routes/paths";

export default function App() {
  return (
    <BrowserRouter>
      <MessageToastContainer />
      <ConfirmDialogContainer />
      <Routes>
        <Route
          path={paths.home}
          element={<Navigate to={paths.login} replace />}
        />
        <Route path={paths.register} element={<RegisterPage />} />
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
        <Route
          path={paths.dashboard}
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.products}
          element={
            <RequireAuth>
              <ProdutosPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.categories}
          element={
            <RequireAuth>
              <CategoriasPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.suppliers}
          element={
            <RequireAuth>
              <FornecedoresPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.movements}
          element={
            <RequireAuth>
              <MovimentacoesPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.reports}
          element={
            <RequireAuth>
              <RelatoriosPage />
            </RequireAuth>
          }
        />
        <Route
          path={paths.profile}
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        {/* Redirecionamentos a partir de URLs antigas em português */}
        <Route path="/cadastro" element={<Navigate to={paths.register} replace />} />
        <Route path="/entrar" element={<Navigate to={paths.login} replace />} />
        <Route
          path="*"
          element={<Navigate to={paths.login} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
