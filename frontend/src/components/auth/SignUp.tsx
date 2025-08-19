import { SignUp as ClerkSignUp } from '@clerk/clerk-react'

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ClerkSignUp 
          routing="hash"
          signInUrl="/sign-in"
          redirectUrl="/"
        />
      </div>
    </div>
  )
}