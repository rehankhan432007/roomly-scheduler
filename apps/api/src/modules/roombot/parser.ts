import { parse } from 'chrono-node';
import type { ParsedIntent } from '@meetmaze/shared/modules/experience';

export function parseIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  const parsed: ParsedIntent = { intent: 'CHITCHAT' };

  // Intent classification
  if (lower.match(/\b(book|reserve|schedule|hold)\b/)) {
    parsed.intent = 'BOOK_ROOM';
  } else if (lower.match(/\b(available|availability|free|open)\b/)) {
    parsed.intent = 'CHECK_AVAILABILITY';
  } else if (lower.match(/\b(cancel|delete|remove)\b/)) {
    parsed.intent = 'CANCEL_BOOKING';
  } else if (lower.match(/\b(my|upcoming)\s+(bookings|meetings|reservations)\b/)) {
    parsed.intent = 'MY_BOOKINGS';
  } else if (lower.match(/^(yes|yep|yeah|confirm|sure|ok|okay)\b/)) {
    parsed.intent = 'CONFIRM';
  } else if (lower.match(/^(no|nope|cancel|nevermind|decline)\b/)) {
    parsed.intent = 'DECLINE';
  } else if (lower.match(/\b(help|what can you do)\b/)) {
    parsed.intent = 'HELP';
  }

  // Extract attendees
  const attMatch = text.match(/(\d+)\s*(people|persons|pax|members|attendees|of us)/i);
  if (attMatch) {
    parsed.attendeeCount = parseInt(attMatch[1], 10);
  }

  // Extract duration
  const durMatch = text.match(/(\d+)\s*(hour|hr|h|minute|min|m)s?/i);
  if (durMatch) {
    const val = parseInt(durMatch[1], 10);
    const unit = durMatch[2].toLowerCase();
    if (unit.startsWith('h')) parsed.durationMin = val * 60;
    else parsed.durationMin = val;
  }

  // Extract equipment
  const equipment: string[] = [];
  if (lower.match(/\b(projector|beamer)\b/)) equipment.push('PROJECTOR');
  if (lower.match(/\b(whiteboard|board)\b/)) equipment.push('WHITEBOARD');
  if (lower.match(/\b(video( call)?|vc|zoom|teams)\b/)) equipment.push('VIDEO_CONFERENCING');
  if (lower.match(/\b(tv|screen|display)\b/)) equipment.push('TV_SCREEN');
  if (lower.match(/\b(mic|microphone)\b/)) equipment.push('MICROPHONE');
  if (lower.match(/\b(speaker(phone)?)\b/)) equipment.push('SPEAKERPHONE');
  if (lower.match(/\b(hdmi|adapter)\b/)) equipment.push('HDMI_ADAPTER');
  if (lower.match(/\b(cast(ing)?|wireless)\b/)) equipment.push('WIRELESS_CASTING');
  if (lower.match(/\b(power|strips|plugs)\b/)) equipment.push('POWER_STRIPS');
  if (lower.match(/\b(ac|air conditioning)\b/)) equipment.push('AIR_CONDITIONING');
  if (lower.match(/\b(wheelchair|accessible)\b/)) equipment.push('ACCESSIBLE');
  
  if (equipment.length > 0) {
    parsed.equipment = [...new Set(equipment)];
  }

  // Extract date/time using chrono-node
  const dateResults = parse(text, new Date(), { forwardDate: true });
  if (dateResults.length > 0) {
    const date = dateResults[0].start.date();
    parsed.startAt = date.toISOString();
    
    // Check if end time was parsed
    if (dateResults[0].end) {
      const diffMs = dateResults[0].end.date().getTime() - date.getTime();
      parsed.durationMin = Math.round(diffMs / 60000);
    }
  }

  return parsed;
}
