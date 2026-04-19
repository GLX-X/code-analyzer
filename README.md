# Code Error Analyzer AI

A powerful AI-powered code error analyzer and chatbot that helps developers identify, understand, and fix code errors across multiple programming languages.

## Features

- **Multi-Language Support**: Analyze code in JavaScript, Python, Java, C++, C#, PHP, Ruby, Go, Rust, TypeScript, HTML, CSS, and SQL
- **Error Detection**: Identifies syntax errors, type errors, reference errors, and runtime issues
- **Smart Suggestions**: Provides actionable solutions and best practices
- **Interactive Chat**: Ask follow-up questions for deeper understanding
- **Code Quality Analysis**: Evaluates code quality with scoring and improvement suggestions
- **File Upload**: Support for uploading code files directly
- **Modern UI**: Beautiful, responsive interface with dark theme

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Select Language**: Choose the programming language from the dropdown
2. **Input Code**: Either paste your code/error message or upload a file
3. **Analyze**: Click the "Analyze Code/Error" button to get AI-powered analysis
4. **Chat**: Use the chat interface to ask follow-up questions

## API Endpoints

### POST /api/analyze
Analyzes code or error messages.

**Request Body:**
```json
{
  "code": "your code or error message",
  "language": "javascript",
  "isErrorMessage": false
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "errors": [...],
    "warnings": [...],
    "suggestions": [...],
    "explanation": "...",
    "possibleCauses": [...],
    "solutions": [...],
    "codeQuality": {
      "score": 85,
      "issues": [...]
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/chat
Handles chat interactions with the AI assistant.

**Request Body:**
```json
{
  "message": "What does this error mean?",
  "context": {...}
}
```

**Response:**
```json
{
  "success": true,
  "response": "The AI response...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Supported Languages

- JavaScript (.js, .mjs)
- Python (.py)
- Java (.java)
- C++ (.cpp, .cc, .cxx)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- TypeScript (.ts)
- HTML (.html)
- CSS (.css)
- SQL (.sql)

## Error Types Detected

- **Syntax Errors**: Missing semicolons, brackets, parentheses, invalid tokens
- **Type Errors**: Type mismatches, invalid conversions
- **Reference Errors**: Undefined variables, missing declarations
- **Runtime Errors**: Null/undefined access, invalid operations
- **Logic Errors**: Common patterns that lead to bugs

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Analyze code
- `Escape`: Clear input
- `Enter` (in chat): Send message

## Development

To run in development mode with auto-reload:
```bash
npm run dev
```

## Project Structure

```
code-error-analyzer/
  public/
    index.html      # Main HTML file
    app.js          # Frontend JavaScript
    styles.css      # Custom CSS styles
  server.js         # Backend server
  package.json      # Dependencies and scripts
  README.md         # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Syntax Highlighting**: Prism.js
- **Icons**: Font Awesome

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
