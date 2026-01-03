import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

import { eventTypesData, locationsData, modulesData, responsiblePersonsData } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
    const shouldReset = process.env.SEED_FORCE === "true";
    const [moduleCount, eventTypeCount, responsibleCount, locationCount] = await prisma.$transaction([
        prisma.module.count(),
        prisma.eventType.count(),
        prisma.responsiblePerson.count(),
        prisma.location.count(),
    ]);

    const hasSeedData = moduleCount > 0 || eventTypeCount > 0 || responsibleCount > 0 || locationCount > 0;
    if (hasSeedData && !shouldReset) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.event.deleteMany();
        await tx.module.deleteMany();
        await tx.eventType.deleteMany();
        await tx.responsiblePerson.deleteMany();
        await tx.location.deleteMany();

        await tx.module.createMany({ data: modulesData });
        await tx.eventType.createMany({ data: eventTypesData });
        await tx.responsiblePerson.createMany({ data: responsiblePersonsData });
        await tx.location.createMany({ data: locationsData });
    });
}

seed()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
