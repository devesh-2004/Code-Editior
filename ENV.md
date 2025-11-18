# Environment Variables

Create a `.env.local` file in the root of your frontend directory with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000  # Your backend API URL
NEXTAUTH_URL=http://localhost:3000         # Your frontend URL
NEXTAUTH_SECRET=your-secret-key-here       # Generate using: `openssl rand -base64 32`
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Setup

Make sure to set the environment variables in your production environment as well.
