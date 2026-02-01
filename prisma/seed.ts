import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('123456', 12) // Default password for all

    const stores = [
        { code: 'demo', name: 'Demo Store' },
        { code: 'ngasal', name: 'Ngasal' },
    ]

    const users = [
        { username: 'admin', role: 'ADMIN' },
        { username: 'kitchen', role: 'KITCHEN' },
        { username: 'front', role: 'FRONT' },
    ]

    for (const storeData of stores) {
        const store = await prisma.store.upsert({
            where: { code: storeData.code },
            update: { name: storeData.name },
            create: {
                code: storeData.code,
                name: storeData.name,
            }
        })
        console.log(`Store created: ${store.name} (${store.code})`)

        for (const user of users) {
            const upsertUser = await prisma.user.upsert({
                where: {
                    storeId_username: {
                        storeId: store.id,
                        username: user.username
                    }
                },
                update: {
                    password: password,
                },
                create: {
                    storeId: store.id,
                    username: user.username,
                    password: password,
                    role: user.role,
                },
            })
            console.log(`User created: ${upsertUser.username} for store ${store.code}`)
        }
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
