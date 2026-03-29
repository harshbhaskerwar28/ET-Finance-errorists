import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        routing="path"
        path="/sign-up"
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
