# Langy: Portuguese Language Learning App

Langy is a modern web application designed to help users learn Portuguese through flashcards with spaced repetition, AI-powered language tutoring, and interactive study tools.

## Features

- **Flashcard System**: Create and review Portuguese vocabulary using a spaced repetition algorithm
- **AI-Generated Flashcards**: Automatically generate flashcards from Portuguese text
- **Study Mode**: Practice cards with both Portuguese-to-English and English-to-Portuguese modes
- **AI Language Tutor**: Chat with an AI tutor to practice conversational Portuguese
- **Text-to-Speech**: Listen to correct pronunciation of Portuguese words
- **Progress Tracking**: Monitor your learning progress with detailed statistics

## Technology Stack

- **Frontend**: Next.js, React 19, TypeScript
- **UI Components**: Ant Design, TailwindCSS
- **AI Integration**: LangChain, Google Generative AI
- **Text-to-Speech**: AWS Polly
- **Data Storage**: JSON files

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- Yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/langy.git
   cd langy
   ```

2. Install dependencies
   ```bash
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # AI Service API Keys
   GOOGLE_API_KEY=your_google_api_key
   
   # Text-to-Speech API Keys
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   ```

4. Start the development server
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Flashcards

1. Enter Portuguese text, vocabulary lists, or sentences in the input field
2. Click "Generate" to create AI-generated flashcards
3. View and manage your flashcards in the dashboard

### Studying

1. Click "Start Studying" to begin a review session
2. Test your recall in both Portuguese-to-English and English-to-Portuguese directions
3. Track your progress with the spaced repetition system

### Practicing Conversation

1. Click "Practice with AI Tutor" to start a chat session
2. Engage in conversation with an AI tutor designed to help you practice Portuguese
3. Receive feedback and corrections on your language use

## Development

### Project Structure

- `/src/pages` - Next.js pages and API routes
- `/src/components` - Reusable React components
- `/src/services` - Service integrations (AI, TTS, etc.)
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/data` - JSON data storage

### Scripts

- `yarn dev` - Start the development server with Turbopack
- `yarn build` - Build the application for production
- `yarn start` - Start the production server
- `yarn lint` - Run ESLint to check code quality

## License

[MIT](LICENSE)

## Acknowledgements

- This project uses various open-source libraries and AI services to provide a comprehensive language learning experience
- Special thanks to the creators of Next.js, React, and the other technologies that make this project possible

# Langy - Language Learning Flashcard App

## Database Migration to MongoDB

This project has been migrated from JSON file storage to MongoDB for better scalability and performance.

### Prerequisites

- Docker and Docker Compose (for local MongoDB)
- MongoDB instance (local or cloud)

### Setup MongoDB

1. **Local Development with Docker:**
   ```bash
   docker-compose up -d mongodb
   ```

2. **Environment Configuration:**
   Create `.env.local` file with:
   ```
   MONGODB_URI=mongodb://root:root@localhost:27021/langy?authSource=admin
   ```

### Migration from JSON to MongoDB

If you have existing JSON data in the `data/` directory, run the migration script:

```bash
yarn migrate
```

This will:
- Connect to your MongoDB instance
- Create a single `cards` collection
- Transfer all existing card data with username property
- Preserve all SM-2 algorithm data and review history

### Database Structure

Single `cards` collection containing documents with:
- Card content (front/back text)
- Username property for data isolation
- SM-2 algorithm data (ease factor, interval, repetitions)
- Review history and statistics
- Audio file paths

### API Changes

All CardService methods are now asynchronous. The following APIs have been updated:
- `GET /api/cards` - Fetch all cards
- `POST /api/cards/create` - Create new card
- `DELETE /api/cards/[cardId]` - Delete card
- `POST /api/cards/generate` - Generate cards from text
- `POST /api/study/review` - Record study review
- `GET /api/study` - Get study session
- `GET /api/cards/stats` - Get card statistics
- `GET /api/cards/learned` - Get learned cards

### Development

```bash
# Start MongoDB
docker-compose up -d mongodb

# Run migration (if needed)
yarn migrate

# Start development server
yarn dev
```