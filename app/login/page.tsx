import { Suspense } from "react"
import LoginForm from "@/components/login-form"
// import SignUp÷Form from "@/components/sign-up-form"

export default function SignUp() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center">
      <Suspense fallback={<div className="text-sm text-white/90">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
