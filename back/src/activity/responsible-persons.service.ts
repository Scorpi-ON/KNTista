import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

import { BaseReferencesService } from "./base-references.service";

@Injectable()
export class ResponsiblePersonsService extends BaseReferencesService<PrismaService["responsiblePerson"]> {
    constructor(prisma: PrismaService) {
        super(prisma, prisma.responsiblePerson, "responsiblePersonId");
    }

    protected buildCreateData(name: string) {
        return { name };
    }
}
