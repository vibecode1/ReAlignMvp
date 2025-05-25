import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-4xl px-4 md:px-6 mx-auto">
          <div className="prose prose-lg max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using ReAlign, you accept and agree to be bound by the terms and 
              provision of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily use ReAlign for personal, non-commercial transitory 
              viewing only. This license shall automatically terminate if you violate any of these 
              restrictions.
            </p>

            <h2>User Accounts</h2>
            <p>
              You are responsible for safeguarding the password and for maintaining the confidentiality 
              of your account. You agree not to disclose your password to any third party.
            </p>

            <h2>Prohibited Uses</h2>
            <p>
              You may not use our service for any illegal or unauthorized purpose nor may you, 
              in the use of the service, violate any laws in your jurisdiction.
            </p>

            <h2>Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the service immediately, 
              without prior notice or liability, under our sole discretion.
            </p>

            <h2>Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at legal@realign.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};