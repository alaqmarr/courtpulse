// app/(auth)/sign-in/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <main className="flex h-screen w-full items-center justify-center bg-background">
            <div className="rounded-xl border p-6 shadow-md">
                <SignIn
                    appearance={{
                        elements: {
                            formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
                            card: "shadow-none border-none",
                        },
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    redirectUrl="/"
                />
            </div>
        </main>
    );
}
