
"use client";

import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, UploadCloud, File, X, Wallet, Fingerprint, Globe, KeyRound, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  encryptFileInBrowser,
  formatBytes,
  uploadEncryptedToPinata,
} from '@/lib/client-file-crypto';

function generateSecureKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}


export default function UploadPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [version, setVersion] = useState("");
    const [category, setCategory] = useState("");
    const [licenseType, setLicenseType] = useState("");
    const [licenseTerms, setLicenseTerms] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [decryptionKey, setDecryptionKey] = useState("");

    // Licensing rules state
    const [ipLock, setIpLock] = useState(false);
    const [fingerprintLock, setFingerprintLock] = useState(true); // Default to true
    
    // Upload process state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState<
      "idle" | "encrypting" | "uploading" | "saving"
    >("idle");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setDecryptionKey(generateSecureKey());
        }
    };
    
    const handleSubmit = async () => {
        const username = sessionStorage.getItem('username');
        if (!file || !username || !title || !price || !version || !licenseType || !category || !licenseTerms || !decryptionKey) {
            toast({ title: "Missing Information", description: "Please fill out all fields before submitting.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStage("encrypting");

        try {
            toast({
              title: "Encrypting locally…",
              description: `Securing ${formatBytes(file.size)} on your device before upload.`,
            });

            const encryptedBlob = await encryptFileInBrowser(file, decryptionKey);
            const encryptedName = `${file.name}.enc`;

            setUploadStage("uploading");
            setUploadProgress(0);

            const { fileUrl } = await uploadEncryptedToPinata(
              encryptedBlob,
              encryptedName,
              (percent) => setUploadProgress(percent)
            );

            setUploadStage("saving");
            setUploadProgress(100);

            const registerResponse = await fetch("/api/upload/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                description,
                price,
                fileUrl,
                originalFileName: file.name,
                seller: username,
                version,
                category,
                licenseType,
                licenseTerms,
                ipLock,
                fingerprintLock,
                decryptionKey,
              }),
            });

            const result = await registerResponse.json();

            if (registerResponse.ok && result.success) {
                toast({
                    title: "Upload Complete!",
                    description: "Your software has been encrypted and listed on the marketplace.",
                });
                setTimeout(() => router.push('/dashboard'), 1000);
            } else {
                 toast({
                    title: "Upload Error",
                    description: result.message || 'An unexpected error occurred.',
                    variant: "destructive",
                    duration: 9000,
                });
                setIsUploading(false);
                setUploadProgress(0);
                setUploadStage("idle");
            }
        } catch (error) {
             console.error("Upload failed:", error);
             toast({
                title: "Upload Error",
                description:
                  error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during upload.",
                variant: "destructive",
                duration: 9000,
            });
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStage("idle");
        }
    };

    const isFormReady = !!file && !!title && !!price && !!version && !!licenseType && !!category && !!licenseTerms && !!decryptionKey;

    return (
        <main className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-primary to-accent p-4 text-white min-h-screen">
             <div className="absolute left-10 top-10 z-20 flex flex-row items-center gap-3">
        <AppHeaderBrand href="/dashboard" />
      </div>
      <div className="absolute right-10 top-10 z-20">
        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
          <Link href="/dashboard">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
      </div>

            <div className="relative w-full max-w-4xl rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl mt-16 flex flex-col">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold mb-2">Upload New Software</h2>
                    <p className="text-gray-300">Your file will be automatically encrypted before being listed.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 flex-grow">
                    <div className="flex flex-col space-y-3">
                         <div className="space-y-1">
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Title" className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm" disabled={isUploading}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (POL)" className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm" disabled={isUploading}/>
                            </div>
                            <div className="space-y-1">
                                <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version" className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm" disabled={isUploading}/>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                 <Select onValueChange={setCategory} value={category} disabled={isUploading}>
                                    <SelectTrigger className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="productivity">Productivity</SelectItem>
                                        <SelectItem value="design">Design</SelectItem>
                                        <SelectItem value="development">Development</SelectItem>
                                        <SelectItem value="gaming">Gaming</SelectItem>
                                        <SelectItem value="utility">Utility</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-1">
                                <Select onValueChange={setLicenseType} value={licenseType} disabled={isUploading}>
                                    <SelectTrigger className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm">
                                        <SelectValue placeholder="License Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single-use">Single-use</SelectItem>
                                        <SelectItem value="lifetime">Lifetime</SelectItem>
                                        <SelectItem value="subscription">Subscription</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                          <div className="space-y-2 flex-grow flex flex-col">
                            {!file ? (
                                <label htmlFor="file-upload" className="relative flex flex-col items-center justify-center w-full border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors flex-grow min-h-[160px]">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                                        <p className="mb-1 text-sm text-gray-300"><span className="font-semibold">Upload Software File</span></p>
                                        <p className="text-xs text-gray-400">Encrypted in your browser, then uploaded</p>
                                    </div>
                                    <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isUploading}/>
                                </label>
                            ) : (
                                <div className="relative flex items-center justify-between w-full p-3 border border-white/30 rounded-lg bg-white/10 flex-grow min-h-[160px]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <File className="w-6 h-6 text-white flex-shrink-0"/>
                                        <span className="font-medium text-sm truncate" title={file.name}>
                                          {file.name}
                                          <span className="block text-xs text-gray-400">{formatBytes(file.size)}</span>
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7 flex-shrink-0" onClick={() => {setFile(null); setDecryptionKey("");}} disabled={isUploading}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="decryption-key" value={decryptionKey} placeholder="Decryption Key (auto-generated on file select)" className="h-11 border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm pl-10" readOnly={true}/>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Software Description..." className="border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm flex-grow" disabled={isUploading}/>
                        <Textarea id="licenseTerms" value={licenseTerms} onChange={(e) => setLicenseTerms(e.target.value)} placeholder="License Terms..." className="border-white/30 bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm flex-grow" disabled={isUploading}/>
                        <div className="space-y-1">
                             <h3 className="text-lg font-semibold text-center md:text-left">Licensing Rules</h3>
                             <div className="space-y-1">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Wallet className="w-5 h-5 text-green-400"/>
                                        <div>
                                           <Label htmlFor="wallet-lock" className="font-medium">Wallet Address Lock</Label>
                                           <p className="text-xs text-gray-400">License is tied to the buyer's wallet.</p>
                                        </div>
                                    </div>
                                    <Switch id="wallet-lock" checked={true} disabled={true} />
                                </div>
                                 <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint className="w-5 h-5"/>
                                        <div>
                                           <Label htmlFor="fingerprint-lock" className="font-medium">Device Fingerprint Lock</Label>
                                            <p className="text-xs text-gray-400">Buyer can only use from their first device.</p>
                                        </div>
                                    </div>
                                    <Switch id="fingerprint-lock" checked={fingerprintLock} onCheckedChange={setFingerprintLock} disabled={isUploading}/>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
                 <div className="h-8 pt-2">
                    {isUploading && (
                        <div className="space-y-1 text-center">
                            <Progress value={uploadProgress} className="h-2 bg-white/10 border border-white/20 backdrop-blur-sm" />
                            <p className="text-xs text-gray-300">
                              {uploadStage === "encrypting" && "Encrypting on your device…"}
                              {uploadStage === "uploading" && `Uploading to IPFS… ${Math.round(uploadProgress)}%`}
                              {uploadStage === "saving" && "Saving listing…"}
                              {uploadProgress === 100 && uploadStage === "idle" && "Complete!"}
                            </p>
                        </div>
                    )}
                 </div>
                <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 h-12 mt-2"
                    onClick={handleSubmit}
                    disabled={isUploading || !isFormReady}
                >
                   {isUploading ? 'Processing...' : 'Encrypt & Submit'}
                </Button>
            </div>
        </main>
    );
}
