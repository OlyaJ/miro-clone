import { rqClient } from "@/shared/api/instance";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Link } from "react-router-dom";

function LoginPage() {

  const loginMutation = rqClient.useMutation("post", "/auth/login");
  return <main className="grow flex flex-cal pt-[200px] items-center">
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
        <CardDescription>
          Введите ваш email и пароль для входа в систему
        </CardDescription>
      </CardHeader>
      <CardContent>

      </CardContent>
      <CardFooter>
          <p>
            Нет аккаунта? <Button asChild variant="link"><Link to={ROUTES.REGISTER}>Зарегистрироваться</Link></Button>
          </p>
      </CardFooter>
    </Card>
  </main>
}

export const Component = LoginPage;
