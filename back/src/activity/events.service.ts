import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma.service";

import { isEventWithinRange } from "./event-date.utils";
import { EventTypesService } from "./event-types.service";
import { LocationsService } from "./locations.service";
import { ModulesService } from "./modules.service";
import { ResponsiblePersonsService } from "./responsible-persons.service";

@Injectable()
export class EventsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventTypesService: EventTypesService,
        private readonly modulesService: ModulesService,
        private readonly locationsService: LocationsService,
        private readonly responsiblePersonsService: ResponsiblePersonsService,
    ) {}

    private async resolveModuleId(module: { id?: string; name?: string }) {
        if (module.id) {
            return module.id;
        }
        if (!module.name) {
            return undefined;
        }
        return this.modulesService.getIdByName(module.name);
    }

    private async resolveResponsiblePersonId(responsiblePerson: { id?: string; name?: string }) {
        if (responsiblePerson.id) {
            return responsiblePerson.id;
        }
        if (!responsiblePerson.name) {
            return undefined;
        }
        return this.responsiblePersonsService.getIdByName(responsiblePerson.name);
    }

    private async resolveEventTypeId(eventType: { id?: string; name?: string }) {
        if (eventType.id) {
            return eventType.id;
        }
        if (!eventType.name) {
            return undefined;
        }
        return (
            (await this.eventTypesService.getIdByName(eventType.name)) ??
            (await this.eventTypesService.insert(eventType.name)).insertedOrRestored?.id
        );
    }

    private async resolveLocationId(location: {
        id?: string;
        data?: { name: string; isOffline: boolean; address?: string | null };
    }) {
        if (location.id) {
            return location.id;
        }
        if (!location.data) {
            return undefined;
        }
        return (
            (await this.locationsService.getIdByName(location.data.name)) ??
            (await this.locationsService.insert(location.data.name, location.data.isOffline, location.data.address))
                .insertedOrRestored?.id
        );
    }

    async findAll(startDate?: Date, endDate?: Date) {
        const currentDate = new Date();
        startDate ??= new Date(currentDate.getFullYear(), currentDate.getMonth());
        endDate ??= new Date(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));

        const events = await this.prisma.event.findMany({
            include: {
                module: {
                    select: {
                        number: true,
                        name: true,
                    },
                },
                location: {
                    select: {
                        name: true,
                        address: true,
                        isOffline: true,
                    },
                },
                eventType: {
                    select: {
                        name: true,
                    },
                },
                responsiblePerson: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return events.filter((event) => isEventWithinRange(event.startDates, event.endDate, startDate, endDate));
    }

    async insert({
        module,
        startDates,
        endDate,
        location,
        name,
        eventType,
        responsiblePerson,
        participantsCount,
        links,
    }: {
        module: { id?: string; name?: string };
        startDates: Date[];
        endDate?: Date | null;
        location: { id?: string; data?: { name: string; isOffline: boolean; address?: string | null } };
        name: string;
        eventType: { id?: string; name?: string };
        responsiblePerson: { id?: string; name?: string };
        participantsCount: number;
        links: string[];
    }) {
        const moduleId = await this.resolveModuleId(module);
        const responsiblePersonId = await this.resolveResponsiblePersonId(responsiblePerson);
        const locationId = await this.resolveLocationId(location);
        const eventTypeId = await this.resolveEventTypeId(eventType);

        if (!moduleId || !locationId || !eventTypeId || !responsiblePersonId) {
            throw new Error("Some of required fields are undefined");
        }

        const sortedStartDates = [...startDates].sort((a, b) => a.getTime() - b.getTime());
        const created = await this.prisma.event.create({
            data: {
                moduleId,
                startDates: sortedStartDates,
                endDate: endDate ?? null,
                locationId,
                name,
                eventTypeId,
                responsiblePersonId,
                participantsCount,
                links,
            },
        });

        return { insertedOrRestored: created };
    }

    async updateOne(
        id: string,
        {
            module,
            startDates,
            endDate,
            location,
            name,
            eventType,
            responsiblePerson,
            participantsCount,
            links,
        }: {
            module?: {
                id?: string;
                name?: string;
            };
            startDates?: Date[];
            endDate?: Date | null;
            location?: {
                id?: string;
                data?: { name: string; isOffline: boolean; address?: string | null };
            };
            name?: string;
            eventType?: {
                id?: string;
                name?: string;
            };
            responsiblePerson?: {
                id?: string;
                name?: string;
            };
            participantsCount?: number;
            links?: string[];
        },
    ) {
        const moduleId = module ? await this.resolveModuleId(module) : undefined;
        const responsiblePersonId = responsiblePerson ? await this.resolveResponsiblePersonId(responsiblePerson) : undefined;
        const locationId = location ? await this.resolveLocationId(location) : undefined;
        const eventTypeId = eventType ? await this.resolveEventTypeId(eventType) : undefined;

        const sortedStartDates = startDates?.slice().sort((a, b) => a.getTime() - b.getTime());
        const endDateValue = endDate === undefined ? undefined : (endDate ?? null);

        const data = {
            ...(moduleId !== undefined && { moduleId }),
            ...(sortedStartDates !== undefined && { startDates: sortedStartDates }),
            ...(endDate !== undefined && { endDate: endDateValue }),
            ...(locationId !== undefined && { locationId }),
            ...(name !== undefined && { name }),
            ...(eventTypeId !== undefined && { eventTypeId }),
            ...(responsiblePersonId !== undefined && { responsiblePersonId }),
            ...(participantsCount !== undefined && { participantsCount }),
            ...(links !== undefined && { links }),
        };

        if (Object.keys(data).length === 0) {
            return { updated: null };
        }

        const result = await this.prisma.event.updateMany({
            data,
            where: { id },
        });
        if (result.count > 0) {
            const updated = await this.prisma.event.findFirst({ where: { id } });
            return { updated };
        }
        return { updated: null };
    }

    async deleteMany(ids: string[]) {
        const result = await this.prisma.event.deleteMany({ where: { id: { in: ids } } });
        return { deletedRowCount: result.count };
    }
}
