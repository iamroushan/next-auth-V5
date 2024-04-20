"use server"

import * as z from "zod"

import {signIn} from "@/auth"

import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { generateVerificationToken,         generateTwoFactorToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

export const login = async (values: z.infer<typeof LoginSchema>,
    callbackUrl?: string | null
) => {
    const validatedFileds = LoginSchema.safeParse(values)

    if(!validatedFileds.success){
        return {error: "Invalid Fields!"}
    }

    const {email, password, code} = validatedFileds.data

    const existingUser = await getUserByEmail(email)

    if(!existingUser || !existingUser.email || !existingUser.password){
        return {error: "Email does not exist!"}
    }

    if(!existingUser.emailVerified){
        const verificationToken = await generateVerificationToken(existingUser.email)

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        )

        return {
            success: "Confirmation email sent!"
        }
    }

    if(existingUser.isTwoFactorEnabled && existingUser.email){
        if(code){
            const twoFactorToken = await getTwoFactorTokenByEmail(
                existingUser.email
            )

            if(!twoFactorToken){
                return {
                    error: "Invalid Code!"
                }
            }

            if(twoFactorToken.token !== code){
                return {
                    error: "Invalid Code!"
                }
            }

            const hasExpired = new Date(twoFactorToken.expires) < new Date()

            if(hasExpired){
                return {
                    error: "Code Expired!"
                }
            }

            await db.twoFactorToken.delete({
                where: {
                    id: twoFactorToken.id
                }
            })

            const existingConformation = await getTwoFactorConfirmationByUserId(existingUser.id)

            if(existingConformation){
                await db.twoFactorConfirmation.delete({
                    where: {
                        id: existingConformation.id
                    }
                })
            }

            await db.twoFactorConfirmation.create({
                data: {
                    userId: existingUser.id
                }
            })
        }
        else{
            const twoFactorToken = await generateTwoFactorToken(existingUser.email)
            await sendTwoFactorTokenEmail(
                twoFactorToken.email,
                twoFactorToken.token
            )
            return {
                twoFactor:true
            }
        }
    }

    try {
        await signIn("credentials", {
            email, 
            password,
            redirectTo: callbackUrl ||DEFAULT_LOGIN_REDIRECT
        })
    } catch (error) {
        if(error instanceof AuthError){
            switch(error.type){
                case "CredentialsSignin":
                    return { error: "Invalid Credentials!"}
                default: 
                    return { error: "Something went wrong!"}
            }
        }

        throw error
    }

}