const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// AI Analysis Service
class CodeAnalyzer {
    constructor() {
        this.errorPatterns = {
            javascript: [
                { pattern: /SyntaxError:\s*(.+)/i, type: 'syntax', severity: 'high' },
                { pattern: /TypeError:\s*(.+)/i, type: 'type', severity: 'high' },
                { pattern: /ReferenceError:\s*(.+)/i, type: 'reference', severity: 'high' },
                { pattern: /Cannot read property '(.+)' of undefined/i, type: 'undefined', severity: 'medium' },
                { pattern: /(.+) is not a function/i, type: 'function', severity: 'medium' },
                { pattern: /Unexpected token (.+)/i, type: 'syntax', severity: 'high' },
                { pattern: /Missing (.+) after (.+)/i, type: 'syntax', severity: 'medium' }
            ],
            python: [
                { pattern: /SyntaxError:\s*(.+)/i, type: 'syntax', severity: 'high' },
                { pattern: /TypeError:\s*(.+)/i, type: 'type', severity: 'high' },
                { pattern: /NameError:\s*(.+)/i, type: 'name', severity: 'high' },
                { pattern: /AttributeError:\s*(.+)/i, type: 'attribute', severity: 'medium' },
                { pattern: /IndentationError:\s*(.+)/i, type: 'indentation', severity: 'medium' },
                { pattern: /KeyError:\s*(.+)/i, type: 'key', severity: 'medium' },
                { pattern: /IndexError:\s*(.+)/i, type: 'index', severity: 'medium' }
            ],
            java: [
                { pattern: /(.+)Exception:\s*(.+)/i, type: 'exception', severity: 'high' },
                { pattern: /cannot find symbol:\s*(.+)/i, type: 'symbol', severity: 'high' },
                { pattern: /(.+) expected/i, type: 'syntax', severity: 'high' },
                { pattern: /illegal start of expression/i, type: 'syntax', severity: 'high' },
                { pattern: /class (.+) is public, should be declared in file (.+)\.java/i, type: 'naming', severity: 'medium' }
            ],
            cpp: [
                { pattern: /error:\s*(.+)/i, type: 'syntax', severity: 'high' },
                { pattern: /(.+) was not declared in this scope/i, type: 'scope', severity: 'high' },
                { pattern: /invalid conversion from '(.+)' to '(.+)'/i, type: 'conversion', severity: 'medium' },
                { pattern: /no matching function for call to '(.+)'/i, type: 'function', severity: 'medium' }
            ]
        };

        this.solutions = {
            syntax: {
                javascript: [
                    "Check for missing semicolons, parentheses, or brackets",
                    "Ensure proper string quoting and escaping",
                    "Verify variable declarations and scoping",
                    "Check for reserved keywords usage"
                ],
                python: [
                    "Check indentation levels (Python uses whitespace for blocks)",
                    "Ensure colons after if, for, def, class statements",
                    "Verify proper string quoting and escaping",
                    "Check for balanced parentheses and brackets"
                ],
                java: [
                    "Check for missing semicolons at statement ends",
                    "Ensure proper class and method structure",
                    "Verify import statements and package declarations",
                    "Check for balanced braces and parentheses"
                ],
                cpp: [
                    "Check for missing semicolons at statement ends",
                    "Ensure proper header file inclusion",
                    "Verify template syntax and type declarations",
                    "Check for balanced braces and parentheses"
                ]
            },
            type: {
                general: [
                    "Verify variable types match expected types",
                    "Check function parameter types",
                    "Ensure proper type casting if needed",
                    "Review data type declarations"
                ]
            },
            reference: {
                general: [
                    "Check variable declarations before use",
                    "Verify proper scoping of variables",
                    "Ensure functions are defined before calling",
                    "Check for typos in variable names"
                ]
            },
            undefined: {
                general: [
                    "Add null/undefined checks before accessing properties",
                    "Use optional chaining (?.) for safe property access",
                    "Initialize variables properly",
                    "Check object structure before accessing nested properties"
                ]
            }
        };
    }

    analyzeCode(code, language, isErrorMessage = false) {
        const analysis = {
            errors: [],
            warnings: [],
            suggestions: [],
            codeQuality: {
                score: 0,
                issues: []
            },
            fixes: []
        };

        if (isErrorMessage) {
            return this.analyzeErrorMessage(code, language);
        }

        // Analyze code for potential issues
        const patterns = this.errorPatterns[language] || this.errorPatterns.javascript;
        
        patterns.forEach(({ pattern, type, severity }) => {
            const matches = code.match(pattern);
            if (matches) {
                const issue = {
                    type,
                    severity,
                    message: matches[0],
                    line: this.findLineNumber(code, matches.index),
                    suggestion: this.getSuggestion(type, language)
                };
                
                if (severity === 'high') {
                    analysis.errors.push(issue);
                } else {
                    analysis.warnings.push(issue);
                }
            }
        });

        // Code quality analysis
        analysis.codeQuality = this.analyzeCodeQuality(code, language);
        
        // Generate suggestions
        analysis.suggestions = this.generateSuggestions(code, language, analysis.errors, analysis.warnings);
        
        // Generate fixes
        analysis.fixes = this.generateFixes(analysis.errors, analysis.warnings, language);

        return analysis;
    }

    analyzeErrorMessage(errorMessage, language) {
        const analysis = {
            errors: [],
            warnings: [],
            suggestions: [],
            explanation: '',
            possibleCauses: [],
            solutions: []
        };

        const patterns = this.errorPatterns[language] || this.errorPatterns.javascript;
        
        for (const { pattern, type, severity } of patterns) {
            const match = errorMessage.match(pattern);
            if (match) {
                analysis.errors.push({
                    type,
                    severity,
                    message: match[0],
                    details: match[1] || ''
                });
                
                analysis.explanation = this.getErrorExplanation(type, match[1], language);
                analysis.possibleCauses = this.getPossibleCauses(type, language);
                analysis.solutions = this.getSolutions(type, match[1], language);
                break;
            }
        }

        if (analysis.errors.length === 0) {
            // Generic error analysis
            analysis.errors.push({
                type: 'unknown',
                severity: 'medium',
                message: errorMessage
            });
            analysis.explanation = "This appears to be a custom or uncommon error. Please provide more context about what you were trying to do.";
            analysis.solutions = [
                "Check the error message for specific details",
                "Review the code around where the error occurred",
                "Ensure all dependencies are properly installed",
                "Check for environment or configuration issues"
            ];
        }

        return analysis;
    }

    findLineNumber(code, index) {
        const lines = code.substring(0, index).split('\n');
        return lines.length;
    }

    getSuggestion(type, language) {
        const suggestions = this.solutions[type];
        if (suggestions && suggestions[language]) {
            return suggestions[language][0];
        } else if (suggestions && suggestions.general) {
            return suggestions.general[0];
        }
        return "Review the code for common issues related to this error type.";
    }

    getErrorExplanation(type, details, language) {
        const explanations = {
            syntax: `This is a syntax error in your ${language} code. The code structure is incorrect and cannot be parsed.`,
            type: `This is a type error. You're trying to use a value of the wrong type.`,
            reference: `This is a reference error. You're trying to access something that doesn't exist.`,
            undefined: `You're trying to access a property or method on an undefined value.`,
            name: `This is a name error in Python. The variable or function name is not defined.`,
            attribute: `This is an attribute error. The object doesn't have the attribute you're trying to access.`,
            exception: `This is a Java exception. An error occurred during program execution.`
        };
        return explanations[type] || "An error occurred in your code.";
    }

    getPossibleCauses(type, language) {
        const causes = {
            syntax: [
                "Missing semicolons, brackets, or parentheses",
                "Incorrect variable or function declaration",
                "Invalid character encoding",
                "Improper string escaping"
            ],
            type: [
                "Variable assigned wrong data type",
                "Function parameter type mismatch",
                "Incorrect return type",
                "Type conversion needed"
            ],
            reference: [
                "Variable not declared",
                "Function not defined",
                "Variable out of scope",
                "Typo in variable name"
            ],
            undefined: [
                "Object not properly initialized",
                "API call returned null/undefined",
                "Missing error handling",
                "Incorrect property access"
            ]
        };
        return causes[type] || ["Code logic error", "Environmental issue", "Dependency problem"];
    }

    getSolutions(type, details, language) {
        const solutions = this.solutions[type];
        if (solutions && solutions[language]) {
            return solutions[language];
        } else if (solutions && solutions.general) {
            return solutions.general;
        }
        return ["Review the error location", "Check documentation", "Debug step by step"];
    }

    analyzeCodeQuality(code, language) {
        const issues = [];
        let score = 100;

        // Check for common code quality issues
        if (code.length > 1000) {
            issues.push("Consider breaking down large code blocks into smaller functions");
            score -= 10;
        }

        const lines = code.split('\n');
        const emptyLines = lines.filter(line => line.trim().length === 0).length;
        if (emptyLines > lines.length * 0.3) {
            issues.push("Too many empty lines - consider better code organization");
            score -= 5;
        }

        // Language-specific checks
        if (language === 'javascript') {
            if (code.includes('var ')) {
                issues.push("Consider using 'let' or 'const' instead of 'var'");
                score -= 5;
            }
            if (code.includes('==') && !code.includes('===')) {
                issues.push("Consider using '===' for strict equality checks");
                score -= 5;
            }
        }

        return {
            score: Math.max(0, score),
            issues
        };
    }

    generateSuggestions(code, language, errors, warnings) {
        const suggestions = [];

        if (errors.length > 0) {
            suggestions.push("Fix critical errors first - they prevent code from running");
        }

        if (warnings.length > 0) {
            suggestions.push("Address warnings to improve code reliability");
        }

        // Add language-specific suggestions
        if (language === 'javascript') {
            suggestions.push("Consider using ESLint for code quality checks");
            suggestions.push("Add proper error handling with try-catch blocks");
        } else if (language === 'python') {
            suggestions.push("Consider using PEP 8 style guidelines");
            suggestions.push("Add type hints for better code documentation");
        }

        return suggestions;
    }

    generateFixes(errors, warnings, language) {
        const fixes = [];

        errors.forEach(error => {
            fixes.push({
                type: 'error',
                description: `Fix ${error.type} error: ${error.message}`,
                solution: this.getSuggestion(error.type, language)
            });
        });

        warnings.forEach(warning => {
            fixes.push({
                type: 'warning',
                description: `Address ${warning.type} warning: ${warning.message}`,
                solution: this.getSuggestion(warning.type, language)
            });
        });

        return fixes;
    }
}

// Initialize analyzer
const analyzer = new CodeAnalyzer();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { code, language, isErrorMessage = false } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const analysis = analyzer.analyzeCode(code, language, isErrorMessage);
        
        res.json({
            success: true,
            analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Analysis failed', 
            message: error.message 
        });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate AI response based on context and message
        const response = generateChatResponse(message, context);

        res.json({
            success: true,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'Chat failed', 
            message: error.message 
        });
    }
});

function generateChatResponse(message, context) {
    const responses = {
        greeting: [
            "Hello! I'm here to help you with your code analysis. What would you like to know?",
            "Hi! I can help you understand and fix code errors. What's on your mind?"
        ],
        explanation: [
            "Based on the analysis, I can explain what's happening and suggest solutions.",
            "Let me break down what's going on with your code and how to fix it."
        ],
        help: [
            "I can help you with syntax errors, runtime errors, logical bugs, and code quality issues.",
            "I provide error analysis, explanations, solutions, and best practices for various programming languages."
        ],
        default: [
            "That's an interesting question. Let me analyze that for you.",
            "I can help with that. Could you provide more details about your code?"
        ]
    };

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what does')) {
        return responses.explanation[Math.floor(Math.random() * responses.explanation.length)];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return responses.help[Math.floor(Math.random() * responses.help.length)];
    } else {
        return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Code Error Analyzer running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to use the application`);
});

module.exports = app;
