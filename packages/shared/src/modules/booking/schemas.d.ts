import { z } from 'zod';
export declare const CreateBookingSchema: z.ZodObject<{
    roomId: z.ZodString;
    title: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    startAt: z.ZodString;
    endAt: z.ZodString;
    attendeeCount: z.ZodNumber;
    requiredEquipment: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    participantEmails: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    source: z.ZodDefault<z.ZodOptional<z.ZodEnum<["WEB", "ROOMBOT"]>>>;
    matchScore: z.ZodOptional<z.ZodNumber>;
    matchReason: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomId: string;
    title: string;
    startAt: string;
    endAt: string;
    attendeeCount: number;
    requiredEquipment: string[];
    participantEmails: string[];
    source: "WEB" | "ROOMBOT";
    notes?: string | undefined;
    matchScore?: number | undefined;
    matchReason?: string | undefined;
    idempotencyKey?: string | undefined;
}, {
    roomId: string;
    title: string;
    startAt: string;
    endAt: string;
    attendeeCount: number;
    notes?: string | undefined;
    requiredEquipment?: string[] | undefined;
    participantEmails?: string[] | undefined;
    source?: "WEB" | "ROOMBOT" | undefined;
    matchScore?: number | undefined;
    matchReason?: string | undefined;
    idempotencyKey?: string | undefined;
}>;
export declare const SearchCriteriaSchema: z.ZodObject<{
    startAt: z.ZodString;
    endAt: z.ZodString;
    attendeeCount: z.ZodNumber;
    requiredEquipment: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    locationId: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    vibe: z.ZodOptional<z.ZodString>;
    maxHourlyPrice: z.ZodOptional<z.ZodNumber>;
    participantEmails: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    startAt: string;
    endAt: string;
    attendeeCount: number;
    requiredEquipment: string[];
    participantEmails: string[];
    locationId?: string | undefined;
    city?: string | undefined;
    vibe?: string | undefined;
    maxHourlyPrice?: number | undefined;
}, {
    startAt: string;
    endAt: string;
    attendeeCount: number;
    limit?: number | undefined;
    locationId?: string | undefined;
    city?: string | undefined;
    vibe?: string | undefined;
    requiredEquipment?: string[] | undefined;
    participantEmails?: string[] | undefined;
    maxHourlyPrice?: number | undefined;
}>;
export declare const CancelBookingSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const RescheduleBookingSchema: z.ZodObject<{
    startAt: z.ZodString;
    endAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startAt: string;
    endAt: string;
}, {
    startAt: string;
    endAt: string;
}>;
export declare const CheckConflictsSchema: z.ZodObject<{
    roomId: z.ZodString;
    title: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    startAt: z.ZodString;
    endAt: z.ZodString;
    attendeeCount: z.ZodNumber;
    requiredEquipment: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    participantEmails: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    source: z.ZodDefault<z.ZodOptional<z.ZodEnum<["WEB", "ROOMBOT"]>>>;
    matchScore: z.ZodOptional<z.ZodNumber>;
    matchReason: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomId: string;
    title: string;
    startAt: string;
    endAt: string;
    attendeeCount: number;
    requiredEquipment: string[];
    participantEmails: string[];
    source: "WEB" | "ROOMBOT";
    notes?: string | undefined;
    matchScore?: number | undefined;
    matchReason?: string | undefined;
    idempotencyKey?: string | undefined;
}, {
    roomId: string;
    title: string;
    startAt: string;
    endAt: string;
    attendeeCount: number;
    notes?: string | undefined;
    requiredEquipment?: string[] | undefined;
    participantEmails?: string[] | undefined;
    source?: "WEB" | "ROOMBOT" | undefined;
    matchScore?: number | undefined;
    matchReason?: string | undefined;
    idempotencyKey?: string | undefined;
}>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type SearchCriteriaInput = z.infer<typeof SearchCriteriaSchema>;
//# sourceMappingURL=schemas.d.ts.map