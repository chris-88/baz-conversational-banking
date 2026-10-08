# Baz — Opening Experience & First-Message Transition
## Development Handoff

**Status:** Proposed  
**Surface:** Baz chat / PWA / browser  
**Goal:** Replace the scripted intro bubble with a minimal zero-state and a polished first-message transition.

---

## Product intent

Baz should not explain itself before the customer has done anything.

The opening should communicate:

> **There is nothing to learn. Just tell Baz what is happening.**

The first interaction should then transform the central Baz mark into the live conversation itself. The same visual object that waits in the centre should become the avatar beside Baz's first response.

---

## 1. Zero-state

Before any messages exist, show only:

```text
                Baz mark

        What are you trying to do?




------------------------------------------------

  [ rotating example placeholder... ]        ↑
```

No greeting bubble.  
No product explanation.  
No visible product menu.

The composer remains fixed to the bottom.

### Baz mark

Use `baz-mark.svg`.

Recommended rendered size:

```text
mobile: 80–88px
desktop: 88–96px
```

Colour:

```css
color: var(--primary);
```

The SVG uses `currentColor`, so it also works in monochrome.

### Prompt

Primary copy:

> **What are you trying to do?**

Recommended styling:

```text
text-lg / text-xl
font-medium or font-semibold
centred
```

Optional low-emphasis supporting taxonomy:

```text
home · family · saving · borrowing · retirement · everyday money
```

If used, it should be plain muted text, not buttons.

---

## 2. Composer placeholders

Keep the current type → pause → delete → type behaviour, but only while the composer is empty and unfocused.

Suggested phrases:

```text
I'm moving in with my partner…
I want to buy my first home…
We've just had a baby…
I want to get better with money…
I'm not sure what to do with my savings…
I want to retire at 60…
```

Rules:

- stop animation immediately on focus or first keypress;
- do not restart while the user is composing;
- examples should describe situations, not product names.

Suggested timing:

```text
type speed: 42–58ms/character
pause when complete: 1.8–2.3s
delete speed: 22–32ms/character
pause before next example: 350–500ms
```

The accessible label must be static, e.g. `Message Baz`; never rely on the animated placeholder.

---

## 3. Idle motion

The icon should feel present, not gimmicky.

Avoid:

- bounce;
- glowing AI halo;
- spinning;
- particles;
- colour cycling.

### Breathing

```text
scale: 1 → 1.025 → 1
duration: 4.5–5.5s
ease: easeInOut
repeat: infinite
```

Optional vertical travel:

```text
0 → -2px → 0
```

### Orbit dot

The small detached dot can move very slightly every few seconds:

```text
x: 0 → 2px → 0
y: 0 → -1px → 0
duration: ~4.5s
```

Do not rotate the whole mark.

---

## 4. Input focus

As soon as the customer focuses the composer:

```text
placeholder animation: stop
mark scale: 1 → 0.96
prompt opacity: 1 → 0.65
duration: 180–220ms
```

The layout remains centred. This is only a small acknowledgement that the customer has begun.

---

## 5. First-send transition

This is the defining animation.

When the first message is sent, **the central Baz mark becomes the Baz chat avatar**.

It should not disappear and be replaced by another icon.

Use a shared-element/shared-layout transition.

Recommended with Motion for React:

```tsx
<motion.div layoutId="baz-avatar">
  <BazMark />
</motion.div>
```

States:

```text
ZERO STATE
centre screen
80–96px

↓ shared-element transition

CONVERSATION
left of Baz response
32–36px
```

### Choreography

**T+0ms**

Customer presses send.

- composer clears;
- send action enters pending state.

**T+0–120ms**

Prompt exits:

```text
opacity: 1 → 0
y: 0 → -4px
```

**T+40–460ms**

Baz mark moves from centre to conversation-avatar position.

Preferred easing:

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

or approximately:

```ts
{
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8
}
```

No visible bounce.

**T+100–320ms**

Customer message enters from bottom/right:

```text
opacity: 0 → 1
y: 8px → 0
scale: .985 → 1
duration: ~220ms
```

**T+360–500ms**

Conversation settles into its normal layout.

The empty-state content is now removed.

**T+500ms**

Baz enters the responding state.

---

## 6. Typing/responding state

Do not use a spinner.

Recommended:

```text
[Baz avatar]   •  •  •
```

Keep it calm.

Preferred animation:

```text
dot 1: opacity .35 → 1
dot 2: same, +110ms
dot 3: same, +220ms
```

No vertical bouncing.

A nice brand detail is to let the small orbit dot in the Baz mark make one subtle movement while the response is being prepared.

Typing indicator:

```text
height: 36–44px
background: muted
same radius language as Baz messages
```

Minimum visible duration:

```text
350–500ms
```

This prevents a one-frame flash when latency is extremely low. Do not add artificial multi-second delay.

---

## 7. Typing → streamed response

The typing surface should become the answer rather than disappear and be replaced.

Sequence:

1. typing-dot opacity falls over ~100ms;
2. message container expands using layout animation;
3. first streamed text appears within ~80–140ms;
4. response continues streaming.

Avoid:

```text
typing bubble disappears
→ hard gap
→ unrelated answer bubble appears
```

Use one continuous surface where practical.

---

## 8. Header behaviour

The header should remain very quiet.

Suggested zero-state:

```text
Baz
```

or a low-emphasis Baz mark/name.

Once conversation begins:

```text
Baz
AI banking assistant
```

Optional transition:

```text
header opacity: .75 → 1
subtitle opacity: 0 → 1
duration: 200–250ms
```

Do not use `Jarvis, but for banking` as permanent product UI copy.

---

## 9. Conversation UI after activation

After the first response, Baz behaves like normal chat.

The zero-state should never return within that conversation.

Structured banking UI appears only when useful, inline with chat:

- mortgage option cards;
- savings comparisons;
- goals/milestones;
- document requests;
- application progress;
- check-ins;
- partner invitations.

This reinforces:

> **Conversation first. Structure when useful.**

---

## 10. Suggested React state model

Do not rely only on `messages.length`.

Suggested states:

```ts
type ChatUiState =
  | "EMPTY_IDLE"
  | "EMPTY_FOCUSED"
  | "FIRST_MESSAGE_SUBMITTING"
  | "FIRST_MESSAGE_TRANSITION"
  | "BAZ_THINKING"
  | "BAZ_STREAMING"
  | "CONVERSATION_ACTIVE"
  | "ERROR";
```

This prevents network timing from producing awkward layout states.

---

## 11. Suggested implementation skeleton

```tsx
import { AnimatePresence, LayoutGroup, motion } from "motion/react";

function BazAvatar({ mode }: { mode: "hero" | "chat" }) {
  return (
    <motion.div
      layoutId="baz-avatar"
      className={
        mode === "hero"
          ? "h-24 w-24 text-primary"
          : "h-9 w-9 shrink-0 text-primary"
      }
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 34,
        mass: 0.8,
      }}
    >
      <BazMark className="h-full w-full" />
    </motion.div>
  );
}
```

Zero-state:

```tsx
<LayoutGroup>
  <AnimatePresence mode="popLayout">
    {!hasMessages && (
      <motion.section
        key="empty"
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        className="flex flex-1 flex-col items-center justify-center"
      >
        <BazAvatar mode="hero" />
        <h1 className="mt-6 text-xl font-semibold">
          What are you trying to do?
        </h1>
      </motion.section>
    )}
  </AnimatePresence>

  {hasMessages && (
    <div className="flex items-start gap-3">
      <BazAvatar mode="chat" />
      <BazTypingOrMessage />
    </div>
  )}
</LayoutGroup>
```

The exact code can vary. The behavioural requirement is the important part.

---

## 12. First-request error

If the first request fails:

- keep the customer's message;
- keep Baz in chat-avatar position;
- do not return to the opening screen;
- show a compact retry state.

Example:

> I couldn't get that through just now. Try again?

Use a shadcn `Button variant="outline"` for `Retry`.

The customer should not have to retype the message.

---

## 13. Returning conversations

If history exists:

- skip the zero-state;
- render normal conversation immediately;
- do not replay the opening animation.

The transition is only for a genuinely new conversation.

---

## 14. Reduced motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Fallback:

- no breathing;
- no orbit motion;
- centre mark fades out;
- chat avatar fades in;
- customer message fades in;
- transitions <=150ms.

No information or action should depend on animation.

---

## 15. Performance

Requirements:

- inline SVG or lightweight React component;
- no raster asset for the animated logo;
- no Lottie/video/canvas required;
- animate mainly `transform` and `opacity`;
- target 60fps on ordinary iPhone Safari / installed PWA.

---

## 16. Accessibility

For the icon:

- if visible `Baz` text is adjacent, use `aria-hidden="true"`;
- otherwise retain the SVG's `<title>` and `<desc>`.

Composer:

```text
accessible label: Message Baz
```

Responding state:

Announce once via polite live region:

> Baz is responding

Do not announce every typing animation frame or every streamed token individually.

---

## 17. Acceptance criteria

1. New conversations no longer show the scripted Baz introduction.
2. The empty state has the Baz mark centred on screen.
3. `What are you trying to do?` is the only primary instructional copy.
4. Placeholder examples stop as soon as the customer interacts.
5. The first send uses the same Baz mark as a shared element and moves it into the chat avatar position.
6. The customer's first message enters during the transition.
7. Baz shows a subtle response/typing state.
8. Typing transitions smoothly into streamed content.
9. Existing conversations do not replay the zero-state.
10. First-request failure retains the user's message.
11. Reduced-motion behaviour is implemented.
12. The transition remains smooth in mobile Safari/PWA.
13. No extra onboarding, navigation or product menu is added.

---

## Product principle

The opening should communicate the product without explaining it:

> **I don't need to know which banking product I need. I just tell Baz what's going on.**

And the first transition should make one thing visually obvious:

> **The thing waiting in the middle of the screen is now the thing talking to me.**
