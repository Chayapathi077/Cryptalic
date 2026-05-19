"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailPassword } from "@/lib/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { SpiritIntroText } from "@/components/brand/SpiritIntroText";

type IntroPhase =
  | "spirit"
  | "text-out"
  | "crossfade"
  | "ss-hold"
  | "move"
  | "done";

export default function Home() {
  const [introPhase, setIntroPhase] = useState<IntroPhase>("spirit");
  const [spiritTextVisible, setSpiritTextVisible] = useState(true);
  const [fireOpacity, setFireOpacity] = useState(1);
  const [ssOpacity, setSsOpacity] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const isDocked = introPhase === "move" || introPhase === "done";

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const startExitSequence = useCallback(() => {
    schedule(() => {
      setSpiritTextVisible(false);
      setIntroPhase("text-out");
    }, 2000);

    schedule(() => {
      setIntroPhase("crossfade");
      setFireOpacity(0);
      setSsOpacity(1);
    }, 2400);

    schedule(() => setIntroPhase("ss-hold"), 3600);

    schedule(() => setIntroPhase("move"), 4600);

    schedule(() => {
      setIntroPhase("done");
      firstInputRef.current?.focus();
    }, 5600);
  }, [schedule]);

  const handleSpiritTypingComplete = useCallback(() => {
    startExitSequence();
  }, [startExitSequence]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
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
      sessionStorage.setItem("username", result.user.username);
      if (result.user.profileIcon) {
        sessionStorage.setItem("profileIcon", result.user.profileIcon);
      } else {
        sessionStorage.removeItem("profileIcon");
      }
      if (result.user.walletAddress) {
        sessionStorage.setItem("walletAddress", result.user.walletAddress);
      } else {
        sessionStorage.removeItem("walletAddress");
      }
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

  const showSpiritText =
    spiritTextVisible &&
    (introPhase === "spirit" || introPhase === "text-out");

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent p-4">
      <div
        className={cn(
          "absolute z-20 flex transition-all duration-1000 ease-in-out",
          isDocked
            ? "left-4 top-4 flex-row items-center gap-3"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        )}
      >
        <BrandMark
          size={isDocked ? "sm" : "md"}
          fireOpacity={fireOpacity}
          ssOpacity={ssOpacity}
        />

        {!isDocked && (
          <SpiritIntroText
            visible={showSpiritText}
            onTypingComplete={handleSpiritTypingComplete}
          />
        )}

        <div
          className={cn(
            "font-headline font-bold text-white transition-all duration-700 ease-out",
            isDocked
              ? "text-2xl opacity-100"
              : "pointer-events-none h-0 w-0 overflow-hidden opacity-0"
          )}
        >
          Software Shop
        </div>
      </div>

      <div
        className={cn(
          "relative transition-opacity duration-700 ease-out",
          introPhase === "done" ? "opacity-100 delay-300" : "pointer-events-none opacity-0"
        )}
      >
        <div className="glass-panel relative h-auto max-h-[600px] w-[calc(100vw-4rem)] max-w-5xl p-8">
          <div className="flex h-full w-full flex-col items-center justify-between gap-10 lg:flex-row lg:gap-16">
            <div className="w-full text-white lg:w-1/2">
              <h1 className="font-headline text-3xl font-bold leading-tight">
                Your 1-Stop Solution to Sell & Shop Software.
              </h1>
            </div>

            <div className="flex w-full flex-col items-center justify-center text-white lg:w-1/2">
              <div className="w-full max-w-sm">
                <div className="pb-4 text-center">
                  <h2 className="font-headline mb-2 text-3xl font-bold">
                    Welcome Back
                  </h2>
                  <p className="text-base text-gray-300">
                    Sign in with your credentials
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    ref={firstInputRef}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input h-12"
                    onKeyDown={handleKeyDown}
                    disabled={isSigningIn}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input h-12"
                    onKeyDown={handleKeyDown}
                    disabled={isSigningIn}
                  />
                  <div className="-mt-2 text-right">
                    <Button
                      asChild
                      variant="glass-ghost"
                      className="h-auto px-0 text-xs text-gray-300"
                    >
                      <Link href="/forgot-password">Forgot account?</Link>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="glass"
                      size="lg"
                      className="w-full"
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
                    <Button variant="glass" size="lg" className="w-full" asChild>
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
      </div>
    </main>
  );
}
