import { PrismaService } from "../prisma.service";

import { BaseModelDelegate, BaseService, EventForeignKey, FindFirstArgs, FindFirstResult } from "./base.service";

type ReferenceModelDelegate = BaseModelDelegate & {
    create: (args: { data: unknown }) => PromiseLike<unknown>;
    update: (args: { data: unknown; where: unknown }) => PromiseLike<unknown>;
};

type CreateArgs<M extends ReferenceModelDelegate> = M extends { create: (args: infer A) => unknown } ? A : never;
type CreateData<M extends ReferenceModelDelegate> = CreateArgs<M> extends { data: infer D } ? D : never;
type UpdateArgs<M extends ReferenceModelDelegate> = M extends { update: (args: infer A) => unknown } ? A : never;
type CreateResult<M extends ReferenceModelDelegate> = M extends { create: (...args: unknown[]) => infer R }
    ? Awaited<R>
    : never;
type UpdateResult<M extends ReferenceModelDelegate> = M extends { update: (...args: unknown[]) => infer R }
    ? Awaited<R>
    : never;

interface SoftDeleteResult {
    id: string;
    isDeleted: boolean;
}

export abstract class BaseReferencesService<
    M extends ReferenceModelDelegate = ReferenceModelDelegate,
> extends BaseService<M> {
    protected constructor(prisma: PrismaService, model: M, eventForeignKey: EventForeignKey) {
        super(prisma, model, eventForeignKey);
    }

    protected abstract buildCreateData(name: string): CreateData<M> | Promise<CreateData<M>>;

    async insert(name: string) {
        const findArgs = {
            select: { id: true, isDeleted: true },
            where: { name },
        } as FindFirstArgs<M>;
        const existing = (await this.model.findFirst(findArgs)) as SoftDeleteResult | null;
        if (existing) {
            if (existing.isDeleted) {
                const updateArgs = {
                    where: { id: existing.id },
                    data: { isDeleted: false },
                } as UpdateArgs<M>;
                const updated = (await this.model.update(updateArgs)) as UpdateResult<M>;
                return { insertedOrRestored: updated };
            }
            return { insertedOrRestored: null };
        }

        const createArgs = {
            data: await this.buildCreateData(name),
        } as CreateArgs<M>;
        const created = (await this.model.create(createArgs)) as CreateResult<M>;
        return { insertedOrRestored: created };
    }

    async updateOne(id: string, newName: string) {
        const updateArgs = {
            data: { name: newName },
            where: { id },
        };
        const result = await this.model.updateMany(updateArgs);
        if (result.count > 0) {
            const findArgs = { where: { id } };
            const updated = (await this.model.findFirst(findArgs)) as FindFirstResult<M>;
            return { updated };
        }
        return { updated: null };
    }
}
