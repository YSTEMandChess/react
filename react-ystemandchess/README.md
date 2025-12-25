# Y STEM and Chess React Application

This is the main frontend application for the Y STEM and Chess educational platform. It provides an interactive interface for students and mentors to engage with chess lessons, puzzles, and educational content.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Project Structure

After recent modularization, the project follows a feature-based architecture:

```
src/
├── components/          # Reusable UI components
│   ├── navbar/         # Navigation bar component
│   ├── footer/         # Footer component
│   ├── chessboard/     # Chess board component
│   └── ui/             # Generic UI components
├── features/           # Feature-based modules
│   ├── about-us/       # About Us pages
│   ├── auth/           # Authentication (login, signup, password)
│   ├── home/           # Landing page
│   ├── lessons/        # Chess lessons
│   ├── mentor/         # Mentor features
│   ├── programs/       # Programs information
│   ├── puzzles/        # Chess puzzles
│   └── student/        # Student features
├── core/               # Core infrastructure
│   ├── environments/   # Environment configuration
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── assets/             # Static assets
│   └── images/         # Image files
├── App.tsx             # Main application component
├── AppRoutes.tsx       # Route definitions
└── index.tsx           # Application entry point
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Development Guidelines

### Adding New Features

When adding new features to the application:

1. **Create a new feature directory** under `src/features/` with appropriate naming
2. **Use the existing structure** as a template (components, hooks, services)
3. **Update routes** in `src/AppRoutes.tsx` if adding new pages
4. **Follow the established patterns** for imports and file organization

### Component Organization

- **Reusable components** → Place in `src/components/`
- **Feature-specific components** → Place within the relevant feature directory
- **Shared utilities** → Place in `src/core/utils/`
- **API services** → Place in `src/core/services/`

### Import Path Recommendations

Consider using path aliases in `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@core/*": ["src/core/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

## Technology Stack

- **React** 18.3
- **TypeScript** 4.9
- **React Router** 7
- **Tailwind CSS** 3
- **Socket.IO Client** 4
- **Axios** for API calls
- **Chess.js** for chess logic
- **Framer Motion** for animations

## Backend Services

This frontend connects to several backend services:

- **Middleware Node** - Main API backend (port 8000)
- **Chess Server** - Real-time game server (port 3000)
- **Stockfish Server** - Chess AI engine (port 8080)

Make sure these services are running for full functionality.

## Contributing

1. Follow the established directory structure
2. Write TypeScript with proper typing
3. Include tests for new components
4. Update documentation as needed
5. Follow existing code style and conventions
