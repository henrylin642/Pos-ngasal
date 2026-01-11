import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('123456', 12) // Default password for all

    const users = [
        { username: 'admin', role: 'ADMIN' },
        { username: 'kitchen', role: 'KITCHEN' },
        { username: 'front', role: 'FRONT' },
    ]

    for (const user of users) {
        const upsertUser = await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password: password,
            },
            create: {
                username: user.username,
                password: password,
                role: user.role,
            },
        })
        console.log(`User created: ${upsertUser.username}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
