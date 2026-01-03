export function getMonthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEarliestDate(dates: Date[]) {
    if (dates.length === 0) {
        throw new Error("Event has no start dates");
    }
    return dates.reduce((min, date) => (date < min ? date : min), dates[0]);
}

export function isEventWithinRange(
    startDates: Date[],
    endDate: Date | null | undefined,
    rangeStart: Date,
    rangeEnd: Date,
) {
    if (startDates.length === 0) {
        return false;
    }
    const earliestStart = getEarliestDate(startDates);
    return (
        earliestStart >= rangeStart &&
        earliestStart <= rangeEnd &&
        (endDate === null || endDate === undefined || endDate <= rangeEnd)
    );
}

export function isEventActiveInCurrentMonth(startDates: Date[], endDate: Date | null | undefined, now = new Date()) {
    if (startDates.length === 0) {
        return false;
    }
    const currentMonth = getMonthStart(now);
    const startMonth = getMonthStart(getEarliestDate(startDates));
    const endMonth = endDate ? getMonthStart(endDate) : null;

    return (currentMonth >= startMonth && endDate == null) || (endMonth !== null && currentMonth <= endMonth);
}
