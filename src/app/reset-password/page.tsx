
"use client";

import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";
import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, Eye, EyeOff, ArrowLeft, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/lib/auth";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const emailFromParams = searchParams.get("email");
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams));
      passwordRef.current?.focus();
    } else {
      toast({
        title: "Error",
        description: "Invalid link. Please start the recovery process again.",
        variant: "destructive"
      });
      router.push("/forgot-password");
    }
  }, [searchParams, router, toast]);

  const passwordRules = useMemo(() => {
    const lengthMet = password.length >= 16;
    const uppercaseMet = /[A-Z]/.test(password);
    const lowercaseMet = /[a-z]/.test(password);
    const numberMet = /\d/.test(password);
    const specialCharMet = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const matchMet = password !== "" && password === confirmPassword;
    const allMet = lengthMet && uppercaseMet && lowercaseMet && numberMet && specialCharMet && matchMet;
    return { lengthMet, uppercaseMet, lowercaseMet, numberMet, specialCharMet, matchMet, allMet };
  }, [password, confirmPassword]);

  const handleSubmit = async () => {
    if (!passwordRules.allMet) {
      toast({ title: "Error", description: "Please ensure all password requirements are met.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const result = await resetPassword(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Password Reset Successful",
        description: "You can now sign in with your new password.",
      });
      router.push('/');
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (nextFieldRef?.current) {
            nextFieldRef.current.focus();
        } else {
            handleSubmit();
        }
    }
  };

  const Rule = ({ met, children }: { met: boolean; children: React.ReactNode }) => (
    <div className={cn("flex items-center justify-start gap-2 transition-colors", met ? "text-green-400" : "text-gray-400")}>
        <Circle className={cn("h-2.5 w-2.5 transition-colors", met ? "fill-current" : "")} />
        <span className="text-left">{children}</span>
    </div>
  );

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent p-4">
      <div className="absolute left-10 top-10 z-20 flex flex-row items-center gap-3">
        <AppHeaderBrand href="/" />
      </div>
      <div className="absolute right-10 top-10 z-20">
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
          <Link href="/">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
      </div>
      <div className="relative">
        <div className="relative h-auto w-[calc(100vw-4rem)] max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
            <p className="text-gray-300">Create a new, strong password for your account.</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative grid w-full items-center gap-1.5">
              <Input
                ref={passwordRef}
                type={isPasswordVisible ? "text" : "password"}
                id="password"
                placeholder="Enter New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                className="h-12 border-white/30 bg-white/10 text-white placeholder:text-gray-300 backdrop-blur-sm pr-10"
                onKeyDown={(e) => handleKeyDown(e, confirmPasswordRef)}
              />
               <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white" onClick={() => setIsPasswordVisible(prev => !prev)}>
                    {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
            </div>
            <div className="relative grid w-full items-center gap-1.5">
              <Input
                ref={confirmPasswordRef}
                type={isConfirmPasswordVisible ? "text" : "password"}
                id="confirm-password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                className="h-12 border-white/30 bg-white/10 text-white placeholder:text-gray-300 backdrop-blur-sm pr-10"
                onKeyDown={(e) => handleKeyDown(e)}
              />
               <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white" onClick={() => setIsConfirmPasswordVisible(prev => !prev)}>
                    {isConfirmPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
            </div>

             <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs sm:grid-cols-2">
              <Rule met={passwordRules.lengthMet}>16+ characters</Rule>
              <Rule met={passwordRules.uppercaseMet}>1 uppercase</Rule>
              <Rule met={passwordRules.lowercaseMet}>1 lowercase</Rule>
              <Rule met={passwordRules.numberMet}>1 number</Rule>
              <Rule met={passwordRules.specialCharMet}>1 special</Rule>
              <Rule met={passwordRules.matchMet}>Passwords match</Rule>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!passwordRules.allMet || isSubmitting}
            >
              {isSubmitting ? "Resetting Password..." : <><Zap className="mr-2 h-5 w-5" />Save</>}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary to-accent" />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
