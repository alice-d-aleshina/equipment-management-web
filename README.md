# Equipment Management Web Application

This is the web frontend for the equipment management system built with Next.js.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure environment variables:
```
cp .env.example .env.local
```
Then edit the `.env.local` file with your specific configuration.

3. Run the development server:
```
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run linting

## API Connection

By default, the web application expects the Equipment Management API to be running on `http://localhost:3001`. 
This can be configured via the `NEXT_PUBLIC_API_URL` environment variable in `.env.local`.

## Features

- Equipment management interface
- RFID card reader integration
- Map visualization
- User authentication and authorization 