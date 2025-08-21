import { ROUTES } from "@/shared/model/routes";
import { AuthLayout } from "./auth-layout";
import { Link } from "react-router-dom";

function RegisterPage() {
  return (
    <AuthLayout
        title="Регистрация"
        description="Введите ваш email и пароль для входа в систему"
        form={<form></form>}
        footerText={
          <>
            Нет аккаунта? <Link to={ROUTES.LOGIN}>Войти</Link>
          </>
        }
    >
    </AuthLayout>
  )
}

export const Component = RegisterPage;
