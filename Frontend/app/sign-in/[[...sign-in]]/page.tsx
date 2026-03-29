import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        routing="path"
        path="/sign-in"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'bg-card border border-border shadow-xl rounded-2xl',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'border border-border bg-card hover:bg-muted text-foreground',
            formFieldInput: 'bg-muted border-border text-foreground',
            footerActionLink: 'text-primary',
          },
        }}
      />
    </div>
  )
}
