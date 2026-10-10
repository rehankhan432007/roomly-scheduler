import type { ApiModule, ModuleContext, RoomMatch, BookingDto } from '@meetmaze/shared/contracts';
import { z } from 'zod';
import { ApiError, generateId } from '@meetmaze/shared/core';
import { RoomBotMessageInput, type ParsedIntent, type RoomBotIntent, type RoomBotResponse } from '@meetmaze/shared/modules/experience';
import { requireAuth, validate, ok } from '../../core/middleware.js';
import { config } from '../../core/config.js';
import { parseIntent } from './parser.js';
import rateLimit from 'express-rate-limit';

interface SessionState {
  step: 'IDLE' | 'AWAITING_ATTENDEES' | 'AWAITING_TIME' | 'AWAITING_SELECTION' | 'AWAITING_CONFIRM';
  attendeeCount?: number;
  startAt?: string;
  endAt?: string;
  durationMin?: number;
  equipment?: string[];
  locationHint?: string;
  vibe?: string;
  title?: string;
  suggestions?: RoomMatch[];
  heldBookingId?: string;
  selectedRoomId?: string;
}

const roombotModule: ApiModule = {
  name: 'roombot',
  part: 4,
  requires: ['search', 'bookings', 'rooms', 'insights'],

  async register(ctx: ModuleContext): Promise<void> {
    const { router, db } = ctx;
    const logger = ctx.logger as any;

    const limiter = rateLimit({ windowMs: 60000, max: 30, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many messages' } } });

    // POST /roombot/message
    router.post('/roombot/message', requireAuth, limiter, validate({ body: RoomBotMessageInput }), async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const { sessionId: inputSessionId, message, action } = req.body as RoomBotMessageInput;
        const search = ctx.services.get('search');
        const bookings = ctx.services.get('bookings');
        const insights = ctx.services.get('insights');

        // Get or create session
        let sessionId = inputSessionId;
        let state: SessionState = { step: 'IDLE' };

        if (sessionId) {
          const session = await db('chat_sessions').where({ id: sessionId, user_id: userId }).first();
          if (session) {
            state = (typeof session.state === 'string' ? JSON.parse(session.state) : session.state) ?? { step: 'IDLE' };
          } else {
            sessionId = undefined;
          }
        }

        if (!sessionId) {
          sessionId = generateId();
          await db('chat_sessions').insert({ id: sessionId, user_id: userId, state: JSON.stringify(state) });
        }

        // Store user message
        await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'USER', content: message });

        // Handle action buttons
        if (action) {
          const result = await handleAction(action, state, ctx, userId, sessionId);
          await saveState(db, sessionId, result.newState);
          await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'ASSISTANT', content: result.reply });

          ok(res, {
            sessionId, reply: result.reply, intent: result.intent,
            suggestions: result.suggestions ?? [], quickReplies: result.quickReplies ?? [],
            action: result.action, booking: result.booking,
          } satisfies RoomBotResponse);
          return;
        }

        // Parse intent
        const parsed = parseIntent(message);
        logger.info({ parsed }, 'RoomBot parsed intent');

        // Merge parsed fields into state
        if (parsed.attendeeCount) state.attendeeCount = parsed.attendeeCount;
        if (parsed.startAt) state.startAt = parsed.startAt;
        if (parsed.durationMin) state.durationMin = parsed.durationMin;
        if (parsed.equipment) state.equipment = parsed.equipment;
        if (parsed.locationHint) state.locationHint = parsed.locationHint;
        if (parsed.vibe) state.vibe = parsed.vibe;
        if (parsed.title) state.title = parsed.title;

        let reply = '';
        let suggestions: RoomMatch[] = [];
        let quickReplies: string[] = [];
        let responseAction: RoomBotResponse['action'];
        let booking: BookingDto | undefined;

        switch (parsed.intent) {
          case 'BOOK_ROOM':
          case 'CHECK_AVAILABILITY': {
            // Slot filling
            if (!state.attendeeCount) {
              state.step = 'AWAITING_ATTENDEES';
              reply = 'How many people will attend?';
              quickReplies = ['2 people', '4 people', '8 people', '12 people'];
              break;
            }
            if (!state.startAt) {
              state.step = 'AWAITING_TIME';
              reply = 'What time works for you?';
              quickReplies = ['Tomorrow at 10 AM', 'Tomorrow at 2 PM', 'Tomorrow at 4 PM'];
              break;
            }

            // All required info gathered — search
            const duration = state.durationMin ?? 60;
            const startAt = state.startAt;
            const endMs = new Date(startAt).getTime() + duration * 60000;
            const endAt = new Date(endMs).toISOString();
            state.endAt = endAt;

            const searchResult = await search.searchRooms({
              startAt, endAt, attendeeCount: state.attendeeCount,
              requiredEquipment: state.equipment, vibe: state.vibe,
              limit: 3,
            }, { userId });

            suggestions = searchResult.matches.slice(0, 3);
            state.suggestions = suggestions;

            if (suggestions.length === 0) {
              reply = "I couldn't find any available rooms matching your criteria. ";
              if (searchResult.alternatives.length > 0) {
                const alt = searchResult.alternatives[0];
                reply += `How about ${alt.roomName} at a different time? ${alt.reason}`;
              } else {
                reply += 'Try different criteria or a different time.';
              }
              quickReplies = ['Try a different time', 'Show all rooms'];
            } else {
              // Busy warning
              let busyNote = '';
              try {
                const busyWarning = await insights.getBusyWarning({ startAt, endAt });
                if (busyWarning) busyNote = `\n\n⚠️ ${busyWarning.message}`;
              } catch { /* ignore */ }

              reply = `I found ${suggestions.length} room${suggestions.length > 1 ? 's' : ''} for ${state.attendeeCount} people:${busyNote}\n\n`;
              suggestions.forEach((s, i) => {
                reply += `${i + 1}. **${s.room.name}** — ${s.matchScore}% match · ₹${s.room.hourlyPrice}/hr\n   ${s.matchReason}\n`;
              });

              if (parsed.intent === 'BOOK_ROOM') {
                reply += '\nWhich one would you like to book?';
                state.step = 'AWAITING_SELECTION';
                quickReplies = suggestions.map((s, i) => `Book ${s.room.name}`);
                quickReplies.push('None of these');
              } else {
                quickReplies = ['Book the first one', 'Show more options'];
              }
            }
            break;
          }

          case 'CONFIRM': {
            if (state.step === 'AWAITING_CONFIRM' && state.heldBookingId) {
              try {
                booking = await bookings.confirm(state.heldBookingId, { userId });
                const room = await ctx.services.get('rooms').getRoomSummary(booking.roomId);
                reply = `✅ **Done!** ${room?.name ?? 'Your room'} is booked. Scan the QR at the room to check in within 15 minutes of the start.`;
                state = { step: 'IDLE' };
                quickReplies = ['Book another room', 'Show my bookings'];
              } catch (err: any) {
                reply = `Sorry, I couldn't confirm the booking: ${err.message}`;
                quickReplies = ['Try again', 'Cancel'];
              }
            } else {
              reply = "There's nothing to confirm right now. Would you like to book a room?";
              quickReplies = ['Book a room', 'Show my bookings'];
            }
            break;
          }

          case 'DECLINE': {
            if (state.heldBookingId) {
              try {
                await bookings.cancel(state.heldBookingId, { userId }, 'Declined by user');
              } catch { /* ignore */ }
            }
            state = { step: 'IDLE' };
            reply = 'No problem! Let me know if you want to look for another room.';
            quickReplies = ['Book a room', 'Show my bookings'];
            break;
          }

          case 'MY_BOOKINGS': {
            const upcoming = await bookings.listMine(userId, 'upcoming');
            if (upcoming.length === 0) {
              reply = "You don't have any upcoming bookings.";
            } else {
              reply = `You have ${upcoming.length} upcoming booking${upcoming.length > 1 ? 's' : ''}:\n\n`;
              for (const b of upcoming.slice(0, 5)) {
                reply += `• **${b.title}** — ${new Date(b.startAt).toLocaleDateString()} at ${new Date(b.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
              }
            }
            quickReplies = ['Book a room', 'Cancel a booking'];
            break;
          }

          case 'CANCEL_BOOKING': {
            const upcoming = await bookings.listMine(userId, 'upcoming');
            if (upcoming.length === 0) {
              reply = "You don't have any upcoming bookings to cancel.";
            } else if (upcoming.length === 1) {
              try {
                await bookings.cancel(upcoming[0].id, { userId }, 'Cancelled via RoomBot');
                reply = `Cancelled "${upcoming[0].title}".`;
              } catch (err: any) {
                reply = `Couldn't cancel: ${err.message}`;
              }
            } else {
              reply = 'Which booking would you like to cancel?\n\n';
              upcoming.slice(0, 5).forEach((b, i) => {
                reply += `${i + 1}. **${b.title}** — ${new Date(b.startAt).toLocaleDateString()}\n`;
              });
              quickReplies = upcoming.slice(0, 5).map(b => `Cancel "${b.title}"`);
            }
            break;
          }

          case 'HELP': {
            reply = "I'm RoomBot, your meeting room assistant! Here's what I can do:\n\n" +
              '• **Book a room** — "Book a room for 8 people tomorrow at 3 PM with a projector"\n' +
              '• **Check availability** — "What\'s free this afternoon?"\n' +
              '• **Show my bookings** — "Show my bookings"\n' +
              '• **Cancel a booking** — "Cancel my next meeting"\n\n' +
              'Just tell me what you need!';
            quickReplies = ['Book a room', 'Show my bookings', "What's free today?"];
            break;
          }

          case 'CHITCHAT':
          default: {
            // Check if user is answering a slot-filling question
            if (state.step === 'AWAITING_ATTENDEES' && parsed.attendeeCount) {
              // Re-process as BOOK_ROOM with the new info
              state.attendeeCount = parsed.attendeeCount;
              if (state.startAt) {
                // Ready to search — recurse
                return handleBookSearch(state, ctx, userId, sessionId, res, db, logger);
              }
              state.step = 'AWAITING_TIME';
              reply = `Got it — ${state.attendeeCount} people. What time works for you?`;
              quickReplies = ['Tomorrow at 10 AM', 'Tomorrow at 2 PM', 'Tomorrow at 4 PM'];
              break;
            }
            if (state.step === 'AWAITING_TIME' && parsed.startAt) {
              state.startAt = parsed.startAt;
              return handleBookSearch(state, ctx, userId, sessionId, res, db, logger);
            }
            if (state.step === 'AWAITING_SELECTION') {
              // User might be saying "book the first one" or similar
              const match = message.match(/(?:first|1st|#?1\b)/i);
              const match2 = message.match(/(?:second|2nd|#?2\b)/i);
              const match3 = message.match(/(?:third|3rd|#?3\b)/i);
              let selectedIdx = -1;
              if (match) selectedIdx = 0;
              else if (match2) selectedIdx = 1;
              else if (match3) selectedIdx = 2;
              else {
                // Try to match room name
                const sug = state.suggestions ?? [];
                selectedIdx = sug.findIndex(s => message.toLowerCase().includes(s.room.name.toLowerCase()));
              }

              if (selectedIdx >= 0 && state.suggestions && state.suggestions[selectedIdx]) {
                return handleRoomSelection(selectedIdx, state, ctx, userId, sessionId, res, db, logger);
              }
            }

            reply = "I'm here to help you book meeting rooms! Try something like \"Book a room for 8 people tomorrow at 3 PM with a projector\".";
            quickReplies = ['Book a room', 'Show my bookings', 'Help'];
            break;
          }
        }

        await saveState(db, sessionId, state);
        await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'ASSISTANT', content: reply });

        ok(res, {
          sessionId, reply, intent: parsed.intent,
          suggestions, quickReplies,
          action: responseAction, booking,
        } satisfies RoomBotResponse);
      } catch (e) { next(e); }
    });

    // GET /roombot/sessions/:id
    router.get('/roombot/sessions/:id', requireAuth, async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const session = await db('chat_sessions').where({ id: req.params.id, user_id: userId }).first();
        if (!session) throw new ApiError(404, 'NOT_FOUND', 'Session not found');

        const messages = await db('chat_messages').where('session_id', req.params.id).orderBy('created_at').select('*');

        ok(res, {
          id: session.id,
          state: typeof session.state === 'string' ? JSON.parse(session.state) : session.state,
          messages: messages.map((m: any) => ({
            id: m.id, role: m.role, content: m.content,
            createdAt: m.created_at?.toISOString?.() ?? m.created_at,
          })),
        });
      } catch (e) { next(e); }
    });

    // Helper: handle room selection and hold
    async function handleRoomSelection(idx: number, state: SessionState, ctx: ModuleContext, userId: string, sessionId: string, res: any, db: any, logger: any) {
      const selected = state.suggestions![idx];
      const bookings = ctx.services.get('bookings');

      try {
        const held = await bookings.createHold({
          roomId: selected.room.id,
          title: state.title ?? `Meeting in ${selected.room.name}`,
          startAt: state.startAt!,
          endAt: state.endAt!,
          attendeeCount: state.attendeeCount!,
          requiredEquipment: state.equipment,
          source: 'ROOMBOT',
          matchScore: selected.matchScore,
          matchReason: selected.matchReason,
        }, { userId });

        state.heldBookingId = held.id;
        state.selectedRoomId = selected.room.id;
        state.step = 'AWAITING_CONFIRM';

        const reply = `🔒 I've held **${selected.room.name}** for you.\n\n` +
          `📅 ${new Date(state.startAt!).toLocaleDateString()} · ${new Date(state.startAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${new Date(state.endAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
          `💰 ₹${held.totalPrice}\n\n` +
          `Confirm this booking? The hold expires in 5 minutes.`;

        await saveState(db, sessionId, state);
        await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'ASSISTANT', content: reply });

        ok(res, {
          sessionId, reply, intent: 'BOOK_ROOM' as RoomBotIntent,
          suggestions: [], quickReplies: ['Yes, confirm', 'No, cancel'],
          action: { type: 'CONFIRM_BOOKING' as const, payload: { bookingId: held.id } },
          booking: held,
        } satisfies RoomBotResponse);
      } catch (err: any) {
        const reply = `Sorry, I couldn't hold that room: ${err.message}`;
        await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'ASSISTANT', content: reply });
        ok(res, { sessionId, reply, intent: 'BOOK_ROOM' as RoomBotIntent, suggestions: [], quickReplies: ['Try another room'], booking: undefined });
      }
    }

    // Helper: handle book search after all slots filled
    async function handleBookSearch(state: SessionState, ctx: ModuleContext, userId: string, sessionId: string, res: any, db: any, logger: any) {
      const search = ctx.services.get('search');
      const insights = ctx.services.get('insights');

      const duration = state.durationMin ?? 60;
      const endMs = new Date(state.startAt!).getTime() + duration * 60000;
      state.endAt = new Date(endMs).toISOString();

      const searchResult = await search.searchRooms({
        startAt: state.startAt!, endAt: state.endAt, attendeeCount: state.attendeeCount!,
        requiredEquipment: state.equipment, vibe: state.vibe, limit: 3,
      }, { userId });

      const suggestions = searchResult.matches.slice(0, 3);
      state.suggestions = suggestions;

      let reply: string;
      let quickReplies: string[];

      if (suggestions.length === 0) {
        reply = "No rooms available matching your criteria. Try adjusting the time or requirements.";
        quickReplies = ['Try a different time', 'Show all rooms'];
      } else {
        let busyNote = '';
        try {
          const bw = await insights.getBusyWarning({ startAt: state.startAt!, endAt: state.endAt });
          if (bw) busyNote = `\n\n⚠️ ${bw.message}`;
        } catch { /* ignore */ }

        reply = `Found ${suggestions.length} room${suggestions.length > 1 ? 's' : ''}:${busyNote}\n\n`;
        suggestions.forEach((s, i) => {
          reply += `${i + 1}. **${s.room.name}** — ${s.matchScore}% match · ₹${s.room.hourlyPrice}/hr\n   ${s.matchReason}\n`;
        });
        reply += '\nWhich one would you like to book?';
        state.step = 'AWAITING_SELECTION';
        quickReplies = suggestions.map(s => `Book ${s.room.name}`);
        quickReplies.push('None of these');
      }

      await saveState(db, sessionId, state);
      await db('chat_messages').insert({ id: generateId(), session_id: sessionId, role: 'ASSISTANT', content: reply });
      ok(res, { sessionId, reply, intent: 'BOOK_ROOM' as RoomBotIntent, suggestions, quickReplies, booking: undefined } satisfies RoomBotResponse);
    }
  },
};

async function handleAction(
  action: { type: string; payload?: Record<string, unknown> },
  state: SessionState, ctx: ModuleContext, userId: string, sessionId: string,
): Promise<{ reply: string; intent: RoomBotIntent; newState: SessionState; suggestions?: RoomMatch[]; quickReplies?: string[]; action?: RoomBotResponse['action']; booking?: BookingDto }> {
  const bookings = ctx.services.get('bookings');

  if (action.type === 'CONFIRM_BOOKING' && state.heldBookingId) {
    try {
      const booking = await bookings.confirm(state.heldBookingId, { userId });
      const room = await ctx.services.get('rooms').getRoomSummary(booking.roomId);
      return {
        reply: `✅ **Done!** ${room?.name ?? 'Your room'} is booked. Scan the QR at the room to check in within 15 minutes of the start.`,
        intent: 'CONFIRM', newState: { step: 'IDLE' },
        quickReplies: ['Book another room', 'Show my bookings'], booking,
      };
    } catch (err: any) {
      return { reply: `Couldn't confirm: ${err.message}`, intent: 'CONFIRM', newState: state, quickReplies: ['Try again'] };
    }
  }

  if (action.type === 'SELECT_ROOM' && action.payload?.index !== undefined) {
    // handled inline
  }

  return { reply: "I'm not sure what to do with that action.", intent: 'HELP', newState: state, quickReplies: ['Help'] };
}

async function saveState(db: any, sessionId: string, state: SessionState) {
  await db('chat_sessions').where('id', sessionId).update({ state: JSON.stringify(state) });
}

export default roombotModule;
