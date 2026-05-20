
"use client";

import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as bip39 from 'bip39';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SecurityPhrasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [words, setWords] = useState<string[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const signupEmail = sessionStorage.getItem('signup_email');
    if (!signupEmail) {
      toast({
        title: "Error",
        description: "Something went wrong. Please start the sign up process again.",
        variant: "destructive"
      });
      router.push('/signup');
      return;
    }
    setEmail(signupEmail);

    const mnemonic = bip39.generateMnemonic();
    const wordList = mnemonic.split(' ');
    setWords(wordList);
    sessionStorage.setItem('security_phrase', mnemonic);
  }, [router, toast]);

  const handleContinue = useCallback(() => {
    router.push('/verify-phrase');
  }, [router]);

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
        <div className="relative h-auto w-[calc(100vw-4rem)] max-w-lg rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Your Security Phrase</h2>
            <p className="text-gray-300">Write these words down in order. You will need them to recover your account.</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            {words.map((word, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3">
                <span className="text-sm font-mono mr-2 text-gray-400">{index + 1}.</span>
                <span className="font-semibold">{word}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            onClick={handleContinue}
          >
            <Zap className="mr-2 h-5 w-5" />
            Secure
          </Button>
        </div>
      </div>
    </main>
  );
}
