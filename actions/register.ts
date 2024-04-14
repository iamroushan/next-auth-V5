"use server"

import * as z from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFileds = RegisterSchema.safeParse(values)

    if(!validatedFileds.success){
        return {error: "Invalid Fileds!"}
    }

    const {email,password,name} = validatedFileds.data
    const hashedPassword = await bcrypt.hash(password,10)

    const existingUser = await getUserByEmail(email)

    if(existingUser){
        return {
            error: "Email already in use!"
        }
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    })

    // TODO: send verification token email

    return {
        success: "User created!"
    }
}