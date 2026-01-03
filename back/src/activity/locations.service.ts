import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

import { BaseService } from "./base.service";

@Injectable()
export class LocationsService extends BaseService<PrismaService["location"]> {
    constructor(prisma: PrismaService) {
        super(prisma, prisma.location, "locationId");
    }

    async findAll() {
        return super.findAll({
            id: true,
            name: true,
            isOffline: true,
            address: true,
        });
    }

    async search(name?: string, isOffline?: boolean, address?: string | null) {
        const where = {
            isDeleted: false,
            ...(name
                ? {
                      name: {
                          contains: name,
                          mode: "insensitive" as const,
                      },
                  }
                : {}),
            ...(isOffline === undefined ? {} : { isOffline }),
            ...(address === undefined
                ? {}
                : address === null
                  ? { address: null }
                  : {
                        address: {
                            contains: address,
                            mode: "insensitive" as const,
                        },
                    }),
        };

        return this.prisma.location.findMany({
            select: {
                id: true,
                name: true,
                isOffline: true,
                address: true,
            },
            where,
            orderBy: { name: "asc" },
        });
    }

    async insert(name: string, isOffline: boolean, address?: string | null) {
        const existing = await this.prisma.location.findUnique({
            where: { name_isOffline: { name, isOffline } },
        });
        if (existing) {
            if (existing.isDeleted) {
                const updated = await this.prisma.location.update({
                    where: { id: existing.id },
                    data: { isDeleted: false },
                });
                return { insertedOrRestored: updated };
            }
            return { insertedOrRestored: null };
        }

        const created = await this.prisma.location.create({
            data: { name, isOffline, address },
        });
        return { insertedOrRestored: created };
    }

    async updateOne(
        id: string,
        { name, isOffline, address }: { name?: string; isOffline?: boolean; address?: string | null },
    ) {
        const data = {
            ...(name !== undefined && { name }),
            ...(address !== undefined && { address }),
            ...(isOffline !== undefined && { isOffline }),
        };

        if (Object.keys(data).length === 0) {
            return { updated: null };
        }

        const result = await this.prisma.location.updateMany({
            data,
            where: { id },
        });
        if (result.count > 0) {
            const updated = await this.prisma.location.findFirst({ where: { id } });
            return { updated };
        }
        return { updated: null };
    }
}
