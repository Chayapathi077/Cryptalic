"use server";

import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { Contract, JsonRpcProvider } from "ethers";
import { SOFTWARE_LICENSE_ABI } from "./abi";
import {
  ensureSchema,
  isValidId,
  mapLicenseRow,
  mapSoftwareRow,
  parseLicensingRules,
  type LicenseRow,
  type SoftwareRow,
  type UserRow,
} from "./db";

const SOFTWARE_LICENSE_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_SOFTWARE_LICENSE_CONTRACT_ADDRESS ||
  "0xa3BBFe67BA745F4A2b566fc31Cc0724Ead830938";

interface CheckUserExistsParams {
  username?: string;
  email?: string;
}

interface LicenseData {
  softwareId: string;
  buyerAddress: string;
  tokenId: number;
  transactionHash: string;
  buyerIp: string;
}

interface LicensingRules {
  ipLock: boolean;
  fingerprintLock: boolean;
}

interface SoftwareData {
  title: string;
  description: string;
  price: number;
  fileUrl: string;
  originalFileName?: string;
  seller: string;
  version: string;
  category: string;
  licenseType: string;
  licenseTerms: string;
  logoUrl?: string;
  licensingRules: LicensingRules;
  decryptionKey: string;
}

function userRow(row: Record<string, unknown>): UserRow {
  return row as unknown as UserRow;
}

function softwareRow(row: Record<string, unknown>): SoftwareRow {
  return row as unknown as SoftwareRow;
}

function licenseRow(row: Record<string, unknown>): LicenseRow {
  return row as unknown as LicenseRow;
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (result.rows.length === 0) return null;
  return userRow(result.rows[0]);
}

async function findUserByUsername(username: string): Promise<UserRow | null> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE username = ? LIMIT 1",
    args: [username],
  });
  if (result.rows.length === 0) return null;
  return userRow(result.rows[0]);
}

async function findSoftwareById(id: number): Promise<SoftwareRow | null> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM software WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return softwareRow(result.rows[0]);
}

async function findLicenseById(id: number): Promise<LicenseRow | null> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM licenses WHERE id = ? LIMIT 1",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return licenseRow(result.rows[0]);
}

export async function checkUserExists({
  username,
  email,
}: CheckUserExistsParams): Promise<{ userExists: boolean; message: string }> {
  try {
    if (!username && !email) {
      return { userExists: false, message: "" };
    }

    const db = await ensureSchema();
    let result;

    if (username && email) {
      result = await db.execute({
        sql: "SELECT username, email FROM users WHERE username = ? OR email = ? LIMIT 1",
        args: [username, email],
      });
    } else if (username) {
      result = await db.execute({
        sql: "SELECT username, email FROM users WHERE username = ? LIMIT 1",
        args: [username],
      });
    } else {
      result = await db.execute({
        sql: "SELECT username, email FROM users WHERE email = ? LIMIT 1",
        args: [email!],
      });
    }

    if (result.rows.length === 0) {
      return { userExists: false, message: "" };
    }

    const existing = result.rows[0] as unknown as { username: string; email: string };
    if (username && existing.username === username) {
      return {
        userExists: true,
        message: "This username is already taken. Please choose another one.",
      };
    }
    if (email && existing.email === email) {
      return {
        userExists: true,
        message: "An account with this email address already exists.",
      };
    }

    return { userExists: false, message: "" };
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { userExists: true, message: "An unexpected server error occurred." };
  }
}

export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  securityPhrase: string;
  panNumber: string;
  walletAddress: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { username, email, password, securityPhrase, panNumber, walletAddress } =
      userData;

    if (
      !username ||
      !email ||
      !password ||
      !securityPhrase ||
      !panNumber ||
      !walletAddress
    ) {
      return {
        success: false,
        message: "All fields, including PAN and wallet address, are required.",
      };
    }

    const userCheck = await checkUserExists({ username, email });
    if (userCheck.userExists) {
      return { success: false, message: userCheck.message };
    }

    const db = await ensureSchema();
    const passwordHash = await bcrypt.hash(password, 10);
    const securityPhraseHash = await bcrypt.hash(securityPhrase, 10);
    const panNumberHash = await bcrypt.hash(panNumber, 10);

    const result = await db.execute({
      sql: `INSERT INTO users (
        username, email, password_hash, security_phrase_hash, pan_number_hash, wallet_address
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        username,
        email,
        passwordHash,
        securityPhraseHash,
        panNumberHash,
        walletAddress,
      ],
    });

    if (result.rowsAffected === 0) {
      return { success: false, message: "Failed to create user in the database." };
    }

    return { success: true, message: "User created successfully." };
  } catch (error) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected server error occurred. Please try again later.";
    return { success: false, message };
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{
  success: boolean;
  message: string;
  user?: { username: string; profileIcon?: string; walletAddress?: string };
}> {
  if (!email || !password) {
    return { success: false, message: "Email and password are required." };
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return { success: false, message: "No account found with this email address." };
    }

    if (!user.password_hash) {
      return {
        success: false,
        message: "Account is not set up correctly. No password hash found.",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (isPasswordValid) {
      return {
        success: true,
        message: "Sign-in successful.",
        user: {
          username: user.username,
          profileIcon: user.profile_icon ?? undefined,
          walletAddress: user.wallet_address,
        },
      };
    }

    return { success: false, message: "Incorrect password." };
  } catch (error) {
    console.error("Error signing in with email:", error);
    return {
      success: false,
      message: "An unexpected server error occurred during sign-in.",
    };
  }
}

export async function getMySoftware(username: string): Promise<
  Array<
    ReturnType<typeof mapSoftwareRow> & {
      totalLicenses: number;
      activeLicenses: number;
      blockedLicenses: number;
    }
  >
> {
  try {
    const db = await ensureSchema();
    const softwareResult = await db.execute({
      sql: "SELECT * FROM software WHERE seller_username = ? ORDER BY created_at DESC",
      args: [username],
    });

    const softwareWithStats = await Promise.all(
      softwareResult.rows.map(async (row) => {
        const software = mapSoftwareRow(softwareRow(row));
        const licensesResult = await db.execute({
          sql: "SELECT status FROM licenses WHERE software_id = ?",
          args: [Number(software._id)],
        });
        const statuses = licensesResult.rows.map(
          (r) => (r as unknown as { status: string }).status
        );
        return {
          ...software,
          totalLicenses: statuses.length,
          activeLicenses: statuses.filter((s) => s === "active").length,
          blockedLicenses: statuses.filter((s) => s === "blocked").length,
        };
      })
    );

    return softwareWithStats;
  } catch (error) {
    console.error("Error fetching software:", error);
    return [];
  }
}

export async function getAllSoftware(): Promise<
  Array<ReturnType<typeof mapSoftwareRow>>
> {
  try {
    const db = await ensureSchema();
    const result = await db.execute({
      sql: `SELECT
        s.id, s.seller_id, s.seller_username, s.title, s.description, s.price,
        s.version, s.category, s.license_type, s.license_terms, s.file_url, s.logo_url,
        s.licensing_rules, s.decryption_key, s.created_at,
        u.profile_icon AS seller_profile_icon,
        u.wallet_address AS seller_wallet_address
      FROM software s
      LEFT JOIN users u ON s.seller_id = u.id
      ORDER BY s.created_at DESC`,
      args: [],
    });

    return result.rows.map((row) => mapSoftwareRow(softwareRow(row)));
  } catch (error) {
    console.error("Error fetching all software:", error);
    return [];
  }
}

export async function getUserProfile(
  username: string
): Promise<{ username: string; profileIcon: string | null } | null> {
  try {
    const user = await findUserByUsername(username);
    if (!user) return null;
    return {
      username: user.username,
      profileIcon: user.profile_icon,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  username: string,
  profileData: { profileIcon: string | null }
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await ensureSchema();
    const result = await db.execute({
      sql: "UPDATE users SET profile_icon = ? WHERE username = ?",
      args: [profileData.profileIcon, username],
    });

    if (result.rowsAffected > 0) {
      return { success: true, message: "Profile updated successfully." };
    }
    return {
      success: false,
      message: "User not found or profile is already up-to-date.",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}

export async function sendRecoveryOtp(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.error(
      "Email service is not configured on the server. Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in your .env file."
    );
    return { success: false, message: "Email service is not configured on the server." };
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return { success: false, message: "No account found with this email." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const db = await ensureSchema();
    await db.execute({
      sql: "UPDATE users SET recovery_otp_hash = ?, recovery_otp_expiry = ? WHERE id = ?",
      args: [otpHash, otpExpiry, user.id],
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Software Shop" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: "Your Account Recovery Code",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Software Shop Account Recovery</h2>
          <p>Your one-time recovery code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</p>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return { success: true, message: "A recovery code has been sent to your email." };
  } catch (error) {
    console.error("Error in sendRecoveryOtp:", error);
    return {
      success: false,
      message: "Failed to send recovery email. Please try again later.",
    };
  }
}

export async function verifyRecoveryOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByEmail(email);

    if (!user || !user.recovery_otp_hash || !user.recovery_otp_expiry) {
      return {
        success: false,
        message: "No pending recovery request found for this account.",
      };
    }

    const db = await ensureSchema();

    if (new Date() > new Date(user.recovery_otp_expiry)) {
      await db.execute({
        sql: "UPDATE users SET recovery_otp_hash = NULL, recovery_otp_expiry = NULL WHERE id = ?",
        args: [user.id],
      });
      return {
        success: false,
        message: "The recovery code has expired. Please request a new one.",
      };
    }

    const isOtpValid = await bcrypt.compare(otp, user.recovery_otp_hash);

    if (isOtpValid) {
      await db.execute({
        sql: "UPDATE users SET recovery_otp_hash = NULL, recovery_otp_expiry = NULL WHERE id = ?",
        args: [user.id],
      });
      return { success: true, message: "OTP verified successfully." };
    }

    return { success: false, message: "Invalid recovery code." };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}

export async function recoverAccount(
  email: string,
  phrase: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByEmail(email);

    if (!user || !user.security_phrase_hash) {
      return {
        success: false,
        message: "Account not found or no security phrase is set for it.",
      };
    }

    const isPhraseValid = await bcrypt.compare(phrase, user.security_phrase_hash);

    if (isPhraseValid) {
      return { success: true, message: "Account verified." };
    }

    return {
      success: false,
      message: "The security phrase you entered is incorrect.",
    };
  } catch (error) {
    console.error("Error recovering account:", error);
    return {
      success: false,
      message: "An unexpected server error occurred during account recovery.",
    };
  }
}

export async function resetPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await ensureSchema();
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const result = await db.execute({
      sql: "UPDATE users SET password_hash = ? WHERE email = ?",
      args: [newPasswordHash, email],
    });

    if (result.rowsAffected === 0) {
      return { success: false, message: "Could not find the user to update." };
    }

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}

export async function deleteUserAccount(
  username: string
): Promise<{ success: boolean; message: string }> {
  if (!username) {
    return { success: false, message: "Username is required." };
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const db = await ensureSchema();
    await db.execute({
      sql: "DELETE FROM software WHERE seller_id = ?",
      args: [user.id],
    });

    const result = await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [user.id],
    });

    if (result.rowsAffected > 0) {
      return {
        success: true,
        message: "Account and all associated data deleted successfully.",
      };
    }

    return { success: false, message: "Failed to delete the user account." };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return {
      success: false,
      message: "An unexpected server error occurred during account deletion.",
    };
  }
}

export async function recordLicensePurchase(
  licenseData: LicenseData
): Promise<{ success: boolean; message: string }> {
  const { softwareId, buyerAddress, tokenId, transactionHash, buyerIp } =
    licenseData;

  if (!softwareId || !buyerAddress || tokenId === undefined || !transactionHash) {
    return { success: false, message: "Missing required license data." };
  }

  if (!isValidId(softwareId)) {
    return { success: false, message: "Invalid software ID." };
  }

  try {
    const software = await findSoftwareById(Number(softwareId));
    if (!software) {
      return { success: false, message: "The purchased software does not exist." };
    }

    const db = await ensureSchema();
    await db.execute({
      sql: `INSERT INTO licenses (
        software_id, software_title, buyer_address, token_id, transaction_hash, buyer_ip, device_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, '', 'active')`,
      args: [
        software.id,
        software.title,
        buyerAddress.toLowerCase(),
        tokenId,
        transactionHash,
        buyerIp || "",
      ],
    });

    return { success: true, message: "License purchase recorded successfully." };
  } catch (error) {
    console.error("Error recording license purchase:", error);
    return {
      success: false,
      message: "An unexpected server error occurred while recording the purchase.",
    };
  }
}

export async function getLicensesForBuyer(
  buyerAddress: string
): Promise<Array<ReturnType<typeof mapLicenseRow>>> {
  if (!buyerAddress) {
    return [];
  }

  try {
    const db = await ensureSchema();
    const result = await db.execute({
      sql: "SELECT * FROM licenses WHERE buyer_address = ? ORDER BY mint_date DESC",
      args: [buyerAddress.toLowerCase()],
    });

    return result.rows.map((row) => mapLicenseRow(licenseRow(row)));
  } catch (error) {
    console.error("Error fetching licenses for buyer:", error);
    return [];
  }
}

async function sendViolationEmail(license: LicenseRow) {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.error("Email service is not configured for violation notifications.");
    return;
  }

  try {
    const software = await findSoftwareById(license.software_id);
    if (!software) return;

    const db = await ensureSchema();
    const sellerResult = await db.execute({
      sql: "SELECT username, email FROM users WHERE id = ? LIMIT 1",
      args: [software.seller_id],
    });
    if (sellerResult.rows.length === 0) return;

    const seller = sellerResult.rows[0] as unknown as {
      username: string;
      email: string;
    };
    if (!seller.email) return;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Software Shop Security" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`,
      to: seller.email,
      subject: `[Security Alert] License for "${software.title}" has been blocked`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>License Blocked Notification</h2>
          <p>Hello ${seller.username},</p>
          <p>This is an automated alert to inform you that a license for your software, <strong>${software.title}</strong>, has been automatically blocked due to a security violation.</p>
          <h3>Violation Details:</h3>
          <ul>
            <li><strong>Software:</strong> ${software.title}</li>
            <li><strong>License Token ID:</strong> ${license.token_id}</li>
            <li><strong>Reason for Block:</strong> Device violation (attempted use on a new device).</li>
            <li><strong>Buyer's Wallet:</strong> ${license.buyer_address}</li>
          </ul>
          <p>The license is now inactive. You can review this license and choose to reactivate or permanently revoke it from your seller dashboard.</p>
          <p>Thank you,<br/>The Software Shop Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send violation email:", error);
  }
}

export async function bindDeviceToLicense(
  licenseId: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  if (!licenseId || !deviceId) {
    return { success: false, message: "License ID and Device ID are required." };
  }

  if (!isValidId(licenseId)) {
    return { success: false, message: "Invalid license ID format." };
  }

  try {
    const license = await findLicenseById(Number(licenseId));
    if (!license) {
      return { success: false, message: "License not found." };
    }

    const software = await findSoftwareById(license.software_id);
    const rules = parseLicensingRules(software?.licensing_rules);
    if (!software || !rules.fingerprintLock) {
      return {
        success: true,
        message: "Device binding is not required for this license.",
      };
    }

    if (license.device_id && license.device_id !== deviceId) {
      return {
        success: false,
        message: "This license is already bound to another device.",
      };
    }

    if (!license.device_id) {
      const db = await ensureSchema();
      const result = await db.execute({
        sql: "UPDATE licenses SET device_id = ? WHERE id = ?",
        args: [deviceId, license.id],
      });
      if (result.rowsAffected > 0) {
        return { success: true, message: "Device successfully bound to license." };
      }
    }

    return { success: true, message: "Device is already correctly bound." };
  } catch (error) {
    console.error("Error binding device to license:", error);
    return {
      success: false,
      message: "An unexpected server error occurred during device binding.",
    };
  }
}

export async function getSoftwareFileUrl(
  softwareId: string
): Promise<{
  success: boolean;
  message: string;
  fileUrl?: string;
  originalFileName?: string;
}> {
  if (!softwareId || !isValidId(softwareId)) {
    return { success: false, message: "Invalid software ID." };
  }

  try {
    const software = await findSoftwareById(Number(softwareId));
    if (!software?.file_url) {
      return { success: false, message: "Could not find the software file URL." };
    }

    return {
      success: true,
      message: "URL retrieved.",
      fileUrl: software.file_url,
      originalFileName: software.original_file_name ?? undefined,
    };
  } catch (error) {
    console.error("Error in getSoftwareFileUrl:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}

export async function getDecryptionKey(
  licenseId: string,
  deviceId: string,
  walletAddress: string
): Promise<{
  success: boolean;
  message: string;
  key?: string;
  fileUrl?: string;
}> {
  if (!licenseId || !deviceId || !walletAddress) {
    return {
      success: false,
      message: "License ID, Device ID, and Wallet Address are required.",
    };
  }

  if (!process.env.NEXT_PUBLIC_AMOY_RPC_URL) {
    console.error("Server configuration error: NEXT_PUBLIC_AMOY_RPC_URL is not set.");
    return {
      success: false,
      message: "The server is not configured to communicate with the blockchain.",
    };
  }

  if (!isValidId(licenseId)) {
    return { success: false, message: "Invalid license ID format." };
  }

  try {
    const license = await findLicenseById(Number(licenseId));

    if (!license) {
      return { success: false, message: "License not found in the database." };
    }

    if (license.status !== "active") {
      return {
        success: false,
        message: `License is not active. Current status: ${license.status}. Contact the seller for assistance.`,
      };
    }

    const software = await findSoftwareById(license.software_id);
    if (!software) {
      return { success: false, message: "Could not find the associated software." };
    }

    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_AMOY_RPC_URL);
    const contract = new Contract(
      SOFTWARE_LICENSE_CONTRACT_ADDRESS,
      SOFTWARE_LICENSE_ABI,
      provider
    );

    try {
      const ownerOfToken = await contract.ownerOf(license.token_id);
      if (ownerOfToken.toLowerCase() !== walletAddress.toLowerCase()) {
        return {
          success: false,
          message:
            "Smart contract check failed: The connected wallet is not the owner of this license NFT.",
        };
      }
    } catch (contractError: unknown) {
      console.error("Smart contract call error:", contractError);
      const reason =
        contractError &&
        typeof contractError === "object" &&
        "reason" in contractError &&
        typeof (contractError as { reason: string }).reason === "string"
          ? (contractError as { reason: string }).reason
          : "";

      if (reason.includes("invalid token ID")) {
        const db = await ensureSchema();
        await db.execute({
          sql: `UPDATE licenses SET status = 'revoked', reason = 'Token does not exist (burned)', last_violation_date = ? WHERE id = ?`,
          args: [new Date().toISOString(), license.id],
        });
        return {
          success: false,
          message: "This license has been revoked and no longer exists on the blockchain.",
        };
      }
      return {
        success: false,
        message: "Could not verify license ownership on the blockchain.",
      };
    }

    const rules = parseLicensingRules(software.licensing_rules);
    if (rules.fingerprintLock) {
      if (license.device_id && license.device_id !== deviceId) {
        return {
          success: false,
          message: "Device mismatch. This license is not bound to this device.",
        };
      }
    }

    if (!software.decryption_key || !software.file_url) {
      return {
        success: false,
        message: "Could not find the software's decryption key or file URL.",
      };
    }

    return {
      success: true,
      message: "Key retrieved successfully.",
      key: software.decryption_key,
      fileUrl: software.file_url,
    };
  } catch (error) {
    console.error("Error in getDecryptionKey:", error);
    return { success: false, message: "An unexpected server error occurred." };
  }
}

export async function getLicensesForSoftware(
  softwareId: string
): Promise<Array<ReturnType<typeof mapLicenseRow>>> {
  if (!softwareId || !isValidId(softwareId)) {
    return [];
  }

  try {
    const db = await ensureSchema();
    const result = await db.execute({
      sql: "SELECT * FROM licenses WHERE software_id = ? ORDER BY mint_date DESC",
      args: [Number(softwareId)],
    });

    return result.rows.map((row) => mapLicenseRow(licenseRow(row)));
  } catch (error) {
    console.error("Error fetching licenses for software:", error);
    return [];
  }
}

export async function revokeLicense(
  licenseId: string
): Promise<{ success: boolean; message: string }> {
  if (
    !process.env.NEXT_PUBLIC_SELLER_PRIVATE_KEY ||
    !process.env.NEXT_PUBLIC_AMOY_RPC_URL
  ) {
    return {
      success: false,
      message: "Server is not configured for blockchain transactions.",
    };
  }

  if (!licenseId || !isValidId(licenseId)) {
    return { success: false, message: "Invalid license ID." };
  }

  try {
    const license = await findLicenseById(Number(licenseId));
    if (!license) {
      return { success: false, message: "License not found." };
    }

    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_AMOY_RPC_URL);
    const { Wallet } = await import("ethers");
    const signer = new Wallet(process.env.NEXT_PUBLIC_SELLER_PRIVATE_KEY, provider);
    const contract = new Contract(
      SOFTWARE_LICENSE_CONTRACT_ADDRESS,
      SOFTWARE_LICENSE_ABI,
      signer
    );

    const tx = await contract.revokeLicense(license.token_id);
    await tx.wait();

    const db = await ensureSchema();
    await db.execute({
      sql: "UPDATE licenses SET status = 'revoked', reason = 'Seller revoked' WHERE id = ?",
      args: [license.id],
    });

    return {
      success: true,
      message: `License ${license.token_id} has been permanently revoked.`,
    };
  } catch (error: unknown) {
    console.error("Error revoking license:", error);
    const message =
      error &&
      typeof error === "object" &&
      ("reason" in error || "message" in error)
        ? String(
            (error as { reason?: string; message?: string }).reason ||
              (error as { message?: string }).message
          )
        : "Unknown error";
    return { success: false, message: `Failed to revoke license: ${message}` };
  }
}

export async function reactivateLicense(
  licenseId: string
): Promise<{ success: boolean; message: string }> {
  if (!licenseId || !isValidId(licenseId)) {
    return { success: false, message: "Invalid license ID." };
  }

  try {
    const license = await findLicenseById(Number(licenseId));
    if (!license) {
      return { success: false, message: "License not found." };
    }

    if (license.status === "revoked") {
      return {
        success: false,
        message: "Cannot reactivate a revoked (burned) license.",
      };
    }

    const db = await ensureSchema();
    await db.execute({
      sql: `UPDATE licenses SET status = 'active', reason = NULL, last_violation_date = NULL WHERE id = ?`,
      args: [license.id],
    });

    return { success: true, message: "License has been reactivated." };
  } catch (error: unknown) {
    console.error("Error reactivating license:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to reactivate license: ${message}` };
  }
}

export async function uploadSoftware(
  softwareData: SoftwareData
): Promise<{ success: boolean; message: string; softwareId?: string }> {
  try {
    const {
      title,
      description,
      price,
      fileUrl,
      originalFileName,
      seller,
      version,
      category,
      licenseType,
      licenseTerms,
      logoUrl,
      licensingRules,
      decryptionKey,
    } = softwareData;

    if (
      !title ||
      price === undefined ||
      !fileUrl ||
      !seller ||
      !licensingRules ||
      !version ||
      !licenseType ||
      !licenseTerms ||
      !decryptionKey
    ) {
      return {
        success: false,
        message: "All software details and licensing rules are required.",
      };
    }

    const user = await findUserByUsername(seller);
    if (!user) {
      return { success: false, message: "Seller does not exist." };
    }

    const db = await ensureSchema();
    const result = await db.execute({
      sql: `INSERT INTO software (
        seller_id, seller_username, title, description, price, version, category,
        license_type, license_terms, file_url, original_file_name, logo_url, licensing_rules, decryption_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user.id,
        user.username,
        title,
        description,
        parseFloat(price.toString()) || 0,
        version,
        category,
        licenseType,
        licenseTerms,
        fileUrl,
        originalFileName ?? null,
        logoUrl ?? null,
        JSON.stringify(licensingRules),
        decryptionKey,
      ],
    });

    if (result.lastInsertRowid === undefined || result.lastInsertRowid === null) {
      return {
        success: false,
        message: "Failed to insert software record into database.",
      };
    }

    return {
      success: true,
      message: "Software uploaded successfully.",
      softwareId: String(result.lastInsertRowid),
    };
  } catch (error) {
    console.error("Error uploading software:", error);
    return {
      success: false,
      message: "An unexpected server error occurred.",
    };
  }
}

export async function deleteSoftware(
  softwareId: string
): Promise<{ success: boolean; message: string }> {
  if (!softwareId || !isValidId(softwareId)) {
    return { success: false, message: "Invalid software ID." };
  }

  try {
    const software = await findSoftwareById(Number(softwareId));
    if (!software) {
      return { success: false, message: "Software not found." };
    }

    const db = await ensureSchema();
    await db.execute({
      sql: "DELETE FROM licenses WHERE software_id = ?",
      args: [software.id],
    });

    const result = await db.execute({
      sql: "DELETE FROM software WHERE id = ?",
      args: [software.id],
    });

    if (result.rowsAffected === 0) {
      return { success: false, message: "Failed to delete the software." };
    }

    return {
      success: true,
      message: "Software and all associated licenses have been deleted.",
    };
  } catch (error) {
    console.error("Error deleting software:", error);
    return {
      success: false,
      message: "An unexpected server error occurred while deleting the software.",
    };
  }
}
