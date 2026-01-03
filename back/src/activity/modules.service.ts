import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

import { BaseReferencesService } from "./base-references.service";

@Injectable()
export class ModulesService extends BaseReferencesService<PrismaService["module"]> {
    constructor(prisma: PrismaService) {
        super(prisma, prisma.module, "moduleId");
    }

    protected async buildCreateData(name: string) {
        return { number: (await this.getMaxNumber()) + 1, name };
    }

    async findAll() {
        const [items, counts] = await Promise.all([
            this.prisma.module.findMany({
                select: {
                    id: true,
                    name: true,
                    number: true,
                },
                where: { isDeleted: false },
                orderBy: { number: "asc" },
            }),
            this.getCurrentMonthEventCounts(),
        ]);

        return items.map((item) => ({
            ...item,
            currentMonthEventCount: counts[item.id] ?? 0,
        }));
    }

    async search(name?: string) {
        return this.prisma.module.findMany({
            select: { id: true, name: true },
            where: {
                isDeleted: false,
                ...(name
                    ? {
                          name: {
                              contains: name,
                              mode: "insensitive",
                          },
                      }
                    : {}),
            },
            orderBy: { number: "asc" },
        });
    }

    async getMaxNumber() {
        const result = await this.prisma.module.aggregate({
            _max: { number: true },
            where: { isDeleted: false },
        });
        return result._max.number ?? 0;
    }

    async updateNumbers(ids: string[]) {
        const notPassedIds = await this.prisma.module.findMany({
            select: { id: true },
            where: { id: { notIn: ids } },
            orderBy: { number: "asc" },
        });
        ids.push(...notPassedIds.map((item) => item.id));

        const idsCount = ids.length;
        if (idsCount > 100) {
            throw new Error();
        }

        return this.prisma.$transaction(async (tx) => {
            const updatedResults: Awaited<ReturnType<PrismaService["module"]["update"]>>[] = [];
            for (let i = 0; i < idsCount; ++i) {
                const updated = await tx.module.update({
                    where: { id: ids[i] },
                    data: { number: i + 1 },
                });
                updatedResults.push(updated);
            }
            return updatedResults;
        });
    }
}
