# HELD: Your AI Recovery Friend

Criar aplicação HELD - Anonymous AI Companion for Recovery

STACK OBRIGATÓRIO:

- React + TypeScript + Tailwind CSS

- Supabase (auth + database)

- Stripe checkout

PÁGINAS:

1. Landing (/) - Title "HELD", subtitle "Um companheiro de IA para recuperação", 3 bullet points (Totally anonymous, No credit card needed - 10 free messages, 24/7 available), button "Start Free (10 messages)" linking to /chat, footer with crisis line 988

2. Chat (/chat) - Message input, send button, message history display (user right, assistant left), counter showing "X messages remaining", after 10 messages show upgrade prompt to /checkout

3. Checkout (/checkout) - Stripe payment element, redirect to /dashboard after payment

4. Dashboard (/dashboard) - "You're a paid member!" message, link to Discord community, chat link, logout button

AUTHENTICATION:

- Supabase Auth (email only, no password)

- Auto-generate User_XXXX username on signup

- Store in users table

DATABASE INTEGRATION:

- Connect to existing Supabase tables: users, conversations, messages

- Save message history to messages table

- Track message count in users table

STYLING:

- Purple gradient background

- Clean, minimal design

- Mobile responsive

- Light/dark mode support

NO EXTRAS - MVP ONLY. Production-ready code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/895075c8-6e27-431c-b2a8-93d2fe2bb112).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
