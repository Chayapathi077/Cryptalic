
"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UploadCloud,
  File,
  X,
  Rocket,
  Zap,
  Download,
  FolderArchive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDecryptionKey } from "@/lib/auth";
import { BrowserProvider } from "ethers";
import { cn } from "@/lib/utils";
import {
  decryptCiphertextBuffer,
  decodeText,
  isLikelyText,
  mimeTypeForFileName,
  resolveDecryptedFileName,
  triggerBlobDownload,
} from "@/lib/client-file-crypto";

const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

type LoadedFile =
  | { kind: "text"; fileName: string; content: string }
  | { kind: "binary"; fileName: string; blob: Blob; size: number };

export default function RunSoftwarePage() {
  const { toast } = useToast();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".license.json") || file.name.endsWith(".json")) {
        setLicenseFile(file);
        setLoadedFile(null);
        handleLoadSoftware(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload your .license.json file from My Licenses.",
          variant: "destructive",
        });
        e.target.value = "";
        setLicenseFile(null);
      }
    }
  };

  const handleLoadSoftware = async (fileToLoad: File) => {
    if (!fileToLoad) {
      toast({
        title: "No File",
        description: "Please select a license file to load.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadedFile(null);

    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const licenseFileText = await fileToLoad.text();
      const licenseData = JSON.parse(licenseFileText) as {
        licenseId?: string;
        softwareId?: string;
        encryptedFileUrl?: string;
        fileName?: string;
        softwareTitle?: string;
      };

      const { licenseId, encryptedFileUrl } = licenseData;
      if (!licenseId || !encryptedFileUrl) {
        throw new Error("Invalid license file format.");
      }

      const deviceId = getDeviceId();
      const keyResult = await getDecryptionKey(
        licenseId,
        deviceId,
        walletAddress
      );
      if (!keyResult.success || !keyResult.key) {
        throw new Error(keyResult.message || "Failed to validate license.");
      }

      toast({
        title: "Fetching Software...",
        description: "Downloading encrypted content from IPFS.",
      });

      const response = await fetch(encryptedFileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download encrypted file. Status: ${response.status}`
        );
      }

      const encryptedData = await response.arrayBuffer();

      toast({
        title: "Decrypting...",
        description: "Unlocking your file locally in the browser.",
      });

      const bytes = await decryptCiphertextBuffer(
        encryptedData,
        keyResult.key
      );

      const fileName = resolveDecryptedFileName({
        fileName: licenseData.fileName,
        softwareTitle: licenseData.softwareTitle,
        encryptedFileUrl,
        bytes,
      });

      const blob = new Blob([bytes], { type: mimeTypeForFileName(fileName) });

      if (isLikelyText(bytes)) {
        setLoadedFile({
          kind: "text",
          fileName,
          content: decodeText(bytes),
        });
        toast({
          title: "Success",
          description: "Text content loaded. You can also download the file below.",
        });
      } else {
        setLoadedFile({
          kind: "binary",
          fileName,
          blob,
          size: bytes.length,
        });
        toast({
          title: "Success",
          description: "Your software is ready to download and run on your computer.",
        });
      }
    } catch (error: unknown) {
      console.error("Failed to load software:", error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error Loading Software",
        description: message,
        variant: "destructive",
        duration: 9000,
      });
      setLoadedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDecrypted = () => {
    if (!loadedFile || loadedFile.kind !== "binary") return;
    triggerBlobDownload(loadedFile.blob, loadedFile.fileName);
    toast({
      title: "Download Started",
      description: `Saving ${loadedFile.fileName} to your device.`,
    });
  };

  const isZip =
    loadedFile?.fileName.toLowerCase().endsWith(".zip") ?? false;

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-primary to-accent text-white">
      <header className="sticky top-0 flex h-16 items-center justify-between px-4 md:px-6 z-40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <div
            className={cn(
              "relative flex items-center justify-center h-10 w-10"
            )}
          >
            <div
              className={cn(
                "relative flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-lg",
                "h-10 w-10 p-2"
              )}
            >
              <Zap className="h-5 w-5 text-white absolute -translate-x-1" />
              <Zap className="h-5 w-5 text-white absolute translate-x-1" />
            </div>
          </div>
        </Link>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/buyer">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to My Licenses</span>
          </Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-2xl rounded-xl border border-white/20 bg-white/10 p-8 shadow-lg backdrop-blur-xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Run Licensed Software</h1>
            <p className="text-gray-300 mt-2">
              Upload your <code className="text-sm">.license.json</code> file.
              Your wallet and device are verified, then the real file is
              decrypted locally.
            </p>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="license-upload"
              className={cn(
                "relative flex w-full h-32 border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors",
                { "items-center justify-center": !licenseFile }
              )}
            >
              {!licenseFile ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-1 text-sm text-gray-300">
                    <span className="font-semibold">Click to upload</span> or
                    drag & drop
                  </p>
                  <p className="text-xs text-gray-400">Your .license.json file</p>
                </div>
              ) : (
                <div className="relative flex items-center justify-between w-full p-3 h-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File className="w-6 h-6 text-white flex-shrink-0" />
                    <span
                      className="font-medium text-sm truncate"
                      title={licenseFile.name}
                    >
                      {licenseFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-7 w-7 flex-shrink-0 z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLicenseFile(null);
                      setLoadedFile(null);
                      const input = document.getElementById(
                        "license-upload"
                      ) as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                id="license-upload"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              onClick={() => licenseFile && handleLoadSoftware(licenseFile)}
              disabled={!licenseFile || isLoading}
            >
              <Rocket className="mr-2 h-5 w-5" />
              {isLoading ? "Validating and Loading..." : "Load Licensed Software"}
            </Button>
          </div>
        </div>

        {loadedFile?.kind === "text" && (
          <div className="w-full max-w-2xl rounded-xl border border-white/20 bg-black/20 p-8 shadow-lg backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4">
              Preview: {loadedFile.fileName}
            </h2>
            <pre className="text-sm whitespace-pre-wrap bg-black/30 p-4 rounded-md font-mono text-left max-h-[50vh] overflow-auto">
              <code>{loadedFile.content}</code>
            </pre>
          </div>
        )}

        {loadedFile?.kind === "binary" && (
          <div className="w-full max-w-2xl rounded-xl border border-white/20 bg-black/20 p-8 shadow-lg backdrop-blur-xl space-y-5">
            <div className="flex items-start gap-4">
              <FolderArchive className="h-10 w-10 text-yellow-300 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold">{loadedFile.fileName}</h2>
                <p className="text-sm text-gray-300 mt-1">
                  {(loadedFile.size / 1024 / 1024).toFixed(2)} MB — decrypted
                  successfully
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-white/20 hover:bg-white/30 border border-white/30"
              onClick={handleDownloadDecrypted}
            >
              <Download className="mr-2 h-5 w-5" />
              Download decrypted file
            </Button>

            {isZip ? (
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-sm text-gray-200 space-y-2">
                <p className="font-semibold text-white">
                  How to run a project (ZIP) on your machine
                </p>
                <p>
                  Browsers cannot start <code>localhost</code> or run{" "}
                  <code>npm install</code> for you — that must happen on your
                  computer after you download the ZIP.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>Download the ZIP above and extract it.</li>
                  <li>Open a terminal in the extracted folder.</li>
                  <li>
                    Run the project&apos;s commands (e.g.{" "}
                    <code>npm install</code> then <code>npm run dev</code>).
                  </li>
                  <li>Open the URL shown in the terminal (often localhost:3000).</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-gray-300">
                Open or install the downloaded file on your device. Executables
                and archives cannot run inside this web page for security
                reasons.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
