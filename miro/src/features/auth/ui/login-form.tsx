import { Button } from "@/shared/ui/kit/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/shared/ui/kit/form";
import { Input } from "@/shared/ui/kit/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useLogin } from "../model/use-login";

const loginSchema = z.object({
    email: z.string({ required_error: "Email обязателен" })
        .email("Неверный email"),
    password: z.string({ required_error: "Пароль обязателен" })
        .min(6, "Пароль должен быть не менее 6 символов"),
})


export function LoginForm() {
    const { errorMessage, isPending, login } = useLogin()

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })


    const onSubmit = form.handleSubmit(login)

    return (
        <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="admin@gmail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input placeholder="********" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
                <Button disabled={isPending} type="submit">Войти</Button>
            </form>
        </Form>
    )
}