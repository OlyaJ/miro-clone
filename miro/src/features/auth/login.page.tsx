import { rqClient } from "@/shared/api/instance";

function LoginPage() {

  const loginMutation = rqClient.useMutation("post", "/auth/login");
  return <div>Login page</div>;
}

export const Component = LoginPage;
