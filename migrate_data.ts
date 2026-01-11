import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const db = new Database('prisma/dev.db');

async function migrate() {
    console.log('Starting migration from SQLite to Supabase...');

    // List All Tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in dev.db:', tables);

    // 1. Migrate Categories
    const categories = db.prepare('SELECT * FROM Category').all() as any[];
    console.log(`Found ${categories.length} categories in SQLite.`);

    const categoryIdMap = new Map<number, number>();

    for (const cat of categories) {
        // Create in Postgres
        const createdCat = await prisma.category.create({
            data: {
                name: cat.name,
                sortOrder: cat.sortOrder
            }
        });
        categoryIdMap.set(cat.id, createdCat.id);
        console.log(`Migrated Category: ${cat.name}`);
    }

    // 2. Migrate MenuItems
    const items = db.prepare('SELECT * FROM MenuItem').all() as any[];
    console.log(`Found ${items.length} menu items in SQLite.`);

    for (const item of items) {
        // Find new category ID
        const newCategoryId = categoryIdMap.get(item.categoryId);
        if (!newCategoryId) {
            console.warn(`Skipping item ${item.name}: Category ID ${item.categoryId} not found in new mapping.`);
            continue;
        }

        await prisma.menuItem.create({
            data: {
                name: item.name,
                price: item.price,
                categoryId: newCategoryId,
                description: item.description,
                imageUrl: item.imageUrl,
                isAvailable: item.isAvailable ? true : false // Ensure boolean
            }
        });
        console.log(`Migrated Item: ${item.name}`);
    }

    // 3. Migrate NoteOptions (if any)
    try {
        const notes = db.prepare('SELECT * FROM NoteOption').all() as any[];
        console.log(`Found ${notes.length} notes in SQLite.`);
        for (const note of notes) {
            await prisma.noteOption.create({
                data: {
                    label: note.label,
                    category: note.category
                }
            });
        }
    } catch (e) {
        console.log('No NoteOption table or empty.');
    }

    console.log('Migration completed successfully!');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
