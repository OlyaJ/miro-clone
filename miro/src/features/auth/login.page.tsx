import { ROUTES } from "@/shared/model/routes";
import { Link } from "react-router-dom";
import { AuthLayout } from "./auth-layout";
import { LoginForm } from "./login-form";

function LoginPage() {
  return (
    <AuthLayout
        title="Вход в систему"
        description="Введите ваш email и пароль для входа в систему"
        form={<LoginForm/>}
        footerText={
          <>
            Нет аккаунта? <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
          </>
        }
    >
    </AuthLayout>
  )
}

export const Component = LoginPage;
