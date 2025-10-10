# FillTrip Mobile - Auth wiring

This app connects to the FillTrip PHP backend (filltrip/filltrip-db) using cookie-based PHP sessions.

Configuration:
- Default API base is chosen per platform:
  - Android emulator: http://10.0.2.2/filltrip-db
  - Web/iOS/others: http://localhost/filltrip-db
- To override, set EXPO_PUBLIC_API_BASE in your environment or add `extra.API_BASE` in app.json.

Notes:
- We always send `credentials: 'include'` so session cookies are preserved.
- Ensure your XAMPP server allows CORS for localhost and includes `Access-Control-Allow-Credentials: true`.

Run:
- Start XAMPP (Apache + MySQL) and import `filltrip.sql`.
- From this folder, run Expo (web or Android).
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
