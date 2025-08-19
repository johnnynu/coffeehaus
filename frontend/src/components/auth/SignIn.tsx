import { SignIn as ClerkSignIn } from '@clerk/clerk-react'

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ClerkSignIn 
          routing="hash"
          signUpUrl="/sign-up"
          redirectUrl="/"
        />
      </div>
    </div>
  )
}