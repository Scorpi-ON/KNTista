import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

import { BaseReferencesService } from "./base-references.service";

@Injectable()
export class EventTypesService extends BaseReferencesService<PrismaService["eventType"]> {
    constructor(prisma: PrismaService) {
        super(prisma, prisma.eventType, "eventTypeId");
    }

    protected buildCreateData(name: string) {
        return { name };
    }
}
