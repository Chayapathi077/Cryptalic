"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Phone, Info, Mail, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailPassword } from "@/lib/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type IntroPhase = "spirit" | "presents" | "crossfade" | "move" | "done";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [phase, setPhase] = useState<IntroPhase>("spirit");
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const sequence = [
      { p: "presents" as IntroPhase, t: 1000 },
      { p: "crossfade" as IntroPhase, t: 2000 },
      { p: "move" as IntroPhase, t: 4200 },
      { p: "done" as IntroPhase, t: 4700 },
    ];

    const timeouts = sequence.map(({ p, t }) =>
      setTimeout(() => setPhase(p), t)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Login Failed",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    const result = await signInWithEmailPassword(email, password);
    setIsSigningIn(false);

    if (result.success && result.user) {
      toast({
        title: "Sign In Successful",
        description: `Welcome back, ${result.user.username}!`,
      });
      
      // CodeQL Fix: We removed all sessionStorage.setItem calls here.
      // TODO: Set user session via secure HTTP-only cookies or React Context.
      
      router.push("/dashboard");
    } else {
      toast({
        title: "Sign In Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSignIn();
    }
  };

  const spiritText = "Spirit Services";
  const showIntroTexts = phase === "spirit" || phase === "presents";

  return (
    <main className="font-headline relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent p-4">
      {/* Animated Logo & Text Container */}
      <motion.div
        className="absolute z-50 flex flex-col items-center"
        initial={{ left: "50%", top: "50%", x: "-50%", y: "-50%", scale: 1.5 }}
        animate={
          phase === "move" || phase === "done"
            ? { left: "2.5rem", top: "2.5rem", x: "0%", y: "0%", scale: 1.0 } // 2.5rem = left-10 top-10
            : { left: "50%", top: "50%", x: "-50%", y: "-50%", scale: 1.5 }
        }
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // Apple smooth ease
      >
        <div className="flex flex-row items-center gap-3">
          <BrandMark size="sm" phase={phase} />

          {/* Cryptalic Text Reveal */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={
              phase === "move" || phase === "done"
                ? { width: "auto", opacity: 1 }
                : { width: 0, opacity: 0 }
            }
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="overflow-hidden whitespace-nowrap"
          >
            <div className="font-headline text-2xl font-bold text-white pl-1">
              Cryptalic
            </div>
          </motion.div>
        </div>

        {/* Intro Texts Container */}
        <AnimatePresence>
          {showIntroTexts && (
            <motion.div
              className="absolute top-[120%] flex flex-col items-center justify-center whitespace-nowrap"
              exit={{ opacity: 0, filter: "blur(10px)", y: 10 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              <div className="flex font-headline text-2xl font-bold tracking-wider text-white">
                {spiritText.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={
                  phase === "presents"
                    ? { opacity: 1, letterSpacing: "0.4em" }
                    : { opacity: 0, letterSpacing: "0.1em" }
                }
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="mt-2 text-sm font-medium uppercase text-white/60"
              >
                presents
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Login Interface */}
      <motion.div
        className="relative w-full max-w-5xl"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={
          phase === "done"
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 50, scale: 0.95 }
        }
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // smooth slide up
      >
        <div className="glass-panel relative h-auto max-h-[600px] w-full p-8 lg:p-12">
          <div className="flex h-full w-full flex-col items-center justify-between gap-10 lg:flex-row lg:gap-16">
            <div className="w-full text-white lg:w-1/2">
              <h1 className="font-headline text-4xl font-bold leading-snug tracking-tight lg:text-5xl">
                Your 1-Stop Solution to Sell & Shop Software.
              </h1>
            </div>

            <div className="flex w-full flex-col items-center justify-center text-white lg:w-1/2">
              <div className="w-full max-w-md">
                <div className="pb-6 text-center">
                  <h2 className="font-headline mb-2 text-3xl font-bold">
                    Welcome Back
                  </h2>
                  <p className="text-base text-white/80">
                    Sign in with your credentials
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-white/30 bg-white/10 text-white placeholder:text-gray-300 backdrop-blur-sm"
                    onKeyDown={handleKeyDown}
                    disabled={isSigningIn}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-white/30 bg-white/10 text-white placeholder:text-gray-300 backdrop-blur-sm"
                    onKeyDown={handleKeyDown}
                    disabled={isSigningIn}
                  />
                  <div className="-mt-1 text-right">
                    <Button
                      asChild
                      variant="link"
                      className="h-auto px-0 text-sm text-white/70 hover:text-white"
                    >
                      <Link href="/forgot-password">Forgot account?</Link>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row pt-2">
                    <Button
                      variant="glass"
                      size="lg"
                      className="h-12 w-full text-base font-semibold font-headline bg-white/10 hover:bg-white/20 border-white/20"
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                    >
                      {isSigningIn ? (
                        "Signing In..."
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Sign In
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="glass" 
                      size="lg" 
                      className="h-12 w-full text-base font-semibold font-headline bg-white/10 hover:bg-white/20 border-white/20" 
                      asChild
                    >
                      <Link href="/signup">
                        <Zap className="mr-2 h-5 w-5" />
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals and Footer */}
      <AnimatePresence>
        {showContactModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-[#3a1d3b]/90 p-8 shadow-2xl backdrop-blur-xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute right-6 top-6 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="mb-6 text-2xl font-bold text-white text-center">Get in Touch</h3>
              <div className="flex flex-col gap-4">
                <a
                  href="https://wa.me/918310260713"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1ed760] flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">WhatsApp</h4>
                    <p className="text-sm text-white/70">+91 8310260713</p>
                  </div>
                </a>
                <a
                  href="mailto:prajwaltex@gmail.com"
                  className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff5a5f] flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Email Support</h4>
                    <p className="text-sm text-white/70">prajwaltex@gmail.com</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        )}

        {showPrivacyModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-[#3a1d3b]/90 p-8 shadow-2xl backdrop-blur-xl border border-white/10 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="absolute right-6 top-6 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="mb-6 text-2xl font-bold text-white">Privacy Policy</h3>
              <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                <p>
                  Welcome to Cryptalic. Your privacy is critically important to us. This policy outlines how we handle your data.
                </p>
                <p>
                  <strong className="text-white">1. Data Encryption:</strong> All files are encrypted to ensure maximum security. We do not have access to the raw data you store.
                </p>
                <p>
                  <strong className="text-white">2. Authentication:</strong> We use industry-standard security to manage your login credentials.
                </p>
                <p>
                  <strong className="text-white">3. Use of Data:</strong> Your data is solely used to provide the storage and encryption features of this application.
                </p>
                <p>
                  <strong className="text-white">4. Local Storage:</strong> Certain data may be cached on your device to improve performance. This is also secured and bound to your authentication scope.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between p-6 text-sm text-white/70">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowContactModal(true)}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Phone className="h-4 w-4" />
            Contact
          </button>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Info className="h-4 w-4" />
            Privacy Policy
          </button>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Cryptalic. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
