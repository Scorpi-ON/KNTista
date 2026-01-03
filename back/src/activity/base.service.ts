import { PrismaService } from "../prisma.service";

import { isEventActiveInCurrentMonth } from "./event-date.utils";

export type EventForeignKey = "moduleId" | "locationId" | "eventTypeId" | "responsiblePersonId";

export interface BaseModelDelegate {
    findFirst: (args?: unknown) => PromiseLike<unknown>;
    findMany: (args?: unknown) => PromiseLike<unknown[]>;
    updateMany: (args: unknown) => PromiseLike<{ count: number }>;
    deleteMany: (args?: unknown) => PromiseLike<{ count: number }>;
}

export type FindFirstArgs<M extends BaseModelDelegate> = M extends { findFirst: (args?: infer A) => unknown }
    ? A
    : never;
export type FindManyArgs<M extends BaseModelDelegate> = M extends { findMany: (args?: infer A) => unknown } ? A : never;
export type UpdateManyArgs<M extends BaseModelDelegate> = M extends { updateMany: (args: infer A) => unknown }
    ? A
    : never;
export type DeleteManyArgs<M extends BaseModelDelegate> = M extends { deleteMany: (args?: infer A) => unknown }
    ? A
    : never;
export type FindFirstResult<M extends BaseModelDelegate> = M extends { findFirst: (...args: unknown[]) => infer R }
    ? Awaited<R>
    : never;

type FindManySelect<M extends BaseModelDelegate> =
    NonNullable<FindManyArgs<M>> extends { select?: infer S } ? NonNullable<S> : Record<string, boolean>;
type FindManyItem = { id: string; name: string } & Record<string, unknown>;

interface EventWhereInput {
    moduleId?: string;
    locationId?: string;
    eventTypeId?: string;
    responsiblePersonId?: string;
}

interface BatchPayload {
    count: number;
}

export abstract class BaseService<M extends BaseModelDelegate = BaseModelDelegate> {
    protected constructor(
        protected readonly prisma: PrismaService,
        protected readonly model: M,
        protected readonly eventForeignKey: EventForeignKey,
    ) {}

    private buildEventWhere(id: string): EventWhereInput {
        switch (this.eventForeignKey) {
            case "moduleId":
                return { moduleId: id };
            case "locationId":
                return { locationId: id };
            case "eventTypeId":
                return { eventTypeId: id };
            case "responsiblePersonId":
                return { responsiblePersonId: id };
        }
        throw new Error("Unsupported event foreign key");
    }

    async getIdByName(name: string) {
        const result = (await this.model.findFirst({
            select: { id: true },
            where: { name },
        })) as { id?: string } | null;
        return result?.id;
    }

    protected async getCurrentMonthEventCounts() {
        const events = await this.prisma.event.findMany({
            select: {
                startDates: true,
                endDate: true,
                moduleId: true,
                locationId: true,
                eventTypeId: true,
                responsiblePersonId: true,
            },
        });

        const counts: Record<string, number> = {};
        for (const event of events) {
            const foreignKeyValue = event[this.eventForeignKey];
            if (!isEventActiveInCurrentMonth(event.startDates, event.endDate)) {
                continue;
            }
            counts[foreignKeyValue] = (counts[foreignKeyValue] ?? 0) + 1;
        }
        return counts;
    }

    async findAll(select?: FindManySelect<M>) {
        const [items, counts] = await Promise.all([
            this.model.findMany({
                select: { ...(select ?? {}), id: true, name: true },
                where: { isDeleted: false },
            }) as PromiseLike<FindManyItem[]>,
            this.getCurrentMonthEventCounts(),
        ]);
        const withCounts = items.map((item) => ({
            ...item,
            currentMonthEventCount: counts[item.id] ?? 0,
        }));

        return withCounts.sort((left, right) => {
            const countDiff = right.currentMonthEventCount - left.currentMonthEventCount;
            if (countDiff !== 0) {
                return countDiff;
            }
            return left.name.localeCompare(right.name);
        });
    }

    search(name?: string) {
        return this.model.findMany({
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
            orderBy: { name: "asc" },
        }) as PromiseLike<FindManyItem[]>;
    }

    async deleteOne(id: string) {
        const isUsedInEvent = !!(await this.prisma.event.findFirst({
            select: { id: true },
            where: this.buildEventWhere(id),
        }));

        if (isUsedInEvent) {
            const updateArgs = {
                data: { isDeleted: true },
                where: { id },
            } as UpdateManyArgs<M>;
            await this.model.updateMany(updateArgs);
            return { id, isDeleted: false, isMarkedAsDeleted: true };
        }

        const deleteArgs = { where: { id } } as DeleteManyArgs<M>;
        const result = (await this.model.deleteMany(deleteArgs)) as BatchPayload;
        return { id, isDeleted: result.count > 0, isMarkedAsDeleted: false };
    }

    async deleteUnused() {
        const deleteArgs = {
            where: {
                isDeleted: true,
                events: { none: {} },
            },
        } as DeleteManyArgs<M>;
        const result = (await this.model.deleteMany(deleteArgs)) as BatchPayload;
        return { deletedRowCount: result.count };
    }
}
