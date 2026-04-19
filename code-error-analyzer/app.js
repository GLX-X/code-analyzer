class CodeErrorAnalyzer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.chatHistory = [];
        this.currentAnalysis = null;
    }

    initializeElements() {
        this.elements = {
            language: document.getElementById('language'),
            codeInput: document.getElementById('codeInput'),
            fileInput: document.getElementById('fileInput'),
            fileName: document.getElementById('fileName'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            loadingModal: document.getElementById('loadingModal')
        };
    }

    bindEvents() {
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeCode());
        this.elements.sendBtn.addEventListener('click', () => this.sendChatMessage());
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.elements.codeInput.addEventListener('input', () => this.clearFileName());
    }

    async analyzeCode() {
        const code = this.elements.codeInput.value.trim();
        const language = this.elements.language.value;

        if (!code) {
            this.showNotification('Please enter code or an error message', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const isErrorMessage = this.isErrorMessage(code);
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code,
                    language,
                    isErrorMessage
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentAnalysis = data.analysis;
                this.displayAnalysis(data.analysis);
                this.addChatMessage('ai', this.formatAnalysisResponse(data.analysis));
            } else {
                this.showNotification(data.error || 'Analysis failed', 'error');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showNotification('Failed to analyze code. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    isErrorMessage(text) {
        const errorKeywords = [
            'error', 'exception', 'failed', 'undefined', 'null',
            'cannot', 'invalid', 'missing', 'unexpected', 'syntax',
            'type', 'reference', 'attribute', 'key', 'index'
        ];
        
        const lowerText = text.toLowerCase();
        return errorKeywords.some(keyword => lowerText.includes(keyword)) &&
               text.length < 500; // Error messages are typically shorter
    }

    displayAnalysis(analysis) {
        let html = '';

        if (analysis.errors && analysis.errors.length > 0) {
            html += `
                <div class="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-4">
                    <h3 class="text-red-400 font-semibold mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Errors Found
                    </h3>
                    ${analysis.errors.map(error => `
                        <div class="mb-2">
                            <p class="text-red-300 font-mono text-sm">${error.message}</p>
                            <p class="text-gray-400 text-sm mt-1">${error.suggestion}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (analysis.warnings && analysis.warnings.length > 0) {
            html += `
                <div class="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4 mb-4">
                    <h3 class="text-yellow-400 font-semibold mb-2">
                        <i class="fas fa-exclamation-circle mr-2"></i>Warnings
                    </h3>
                    ${analysis.warnings.map(warning => `
                        <div class="mb-2">
                            <p class="text-yellow-300 font-mono text-sm">${warning.message}</p>
                            <p class="text-gray-400 text-sm mt-1">${warning.suggestion}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (analysis.explanation) {
            html += `
                <div class="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4 mb-4">
                    <h3 class="text-blue-400 font-semibold mb-2">
                        <i class="fas fa-info-circle mr-2"></i>Explanation
                    </h3>
                    <p class="text-gray-300">${analysis.explanation}</p>
                </div>
            `;
        }

        if (analysis.possibleCauses && analysis.possibleCauses.length > 0) {
            html += `
                <div class="bg-purple-900 bg-opacity-50 border border-purple-500 rounded-lg p-4 mb-4">
                    <h3 class="text-purple-400 font-semibold mb-2">
                        <i class="fas fa-search mr-2"></i>Possible Causes
                    </h3>
                    <ul class="list-disc list-inside text-gray-300">
                        ${analysis.possibleCauses.map(cause => `<li class="mb-1">${cause}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (analysis.solutions && analysis.solutions.length > 0) {
            html += `
                <div class="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4 mb-4">
                    <h3 class="text-green-400 font-semibold mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>Solutions
                    </h3>
                    <ul class="list-disc list-inside text-gray-300">
                        ${analysis.solutions.map(solution => `<li class="mb-1">${solution}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (analysis.codeQuality) {
            const qualityScore = analysis.codeQuality.score;
            const qualityColor = qualityScore >= 80 ? 'green' : qualityScore >= 60 ? 'yellow' : 'red';
            
            html += `
                <div class="bg-gray-700 rounded-lg p-4 mb-4">
                    <h3 class="text-gray-300 font-semibold mb-2">
                        <i class="fas fa-chart-line mr-2"></i>Code Quality Score
                    </h3>
                    <div class="flex items-center mb-2">
                        <div class="w-full bg-gray-600 rounded-full h-4 mr-4">
                            <div class="bg-${qualityColor}-500 h-4 rounded-full" style="width: ${qualityScore}%"></div>
                        </div>
                        <span class="text-${qualityColor}-400 font-semibold">${qualityScore}%</span>
                    </div>
                    ${analysis.codeQuality.issues.length > 0 ? `
                        <ul class="list-disc list-inside text-gray-400 text-sm">
                            ${analysis.codeQuality.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }

        if (html) {
            this.addChatMessage('system', html, true);
        }
    }

    formatAnalysisResponse(analysis) {
        let response = "I've analyzed your code. Here's what I found:\n\n";

        if (analysis.errors && analysis.errors.length > 0) {
            response += `**Errors Found:** ${analysis.errors.length}\n`;
            analysis.errors.forEach((error, index) => {
                response += `${index + 1}. ${error.message}\n`;
            });
            response += '\n';
        }

        if (analysis.warnings && analysis.warnings.length > 0) {
            response += `**Warnings:** ${analysis.warnings.length}\n`;
            analysis.warnings.forEach((warning, index) => {
                response += `${index + 1}. ${warning.message}\n`;
            });
            response += '\n';
        }

        if (analysis.explanation) {
            response += `**Explanation:** ${analysis.explanation}\n\n`;
        }

        if (analysis.solutions && analysis.solutions.length > 0) {
            response += `**Recommended Solutions:**\n`;
            analysis.solutions.forEach((solution, index) => {
                response += `${index + 1}. ${solution}\n`;
            });
        }

        if (analysis.codeQuality) {
            response += `\n**Code Quality Score:** ${analysis.codeQuality.score}%`;
        }

        response += "\n\nFeel free to ask me any follow-up questions about these issues!";

        return response;
    }

    async sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        this.addChatMessage('user', message);
        this.elements.chatInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    context: this.currentAnalysis
                })
            });

            const data = await response.json();

            if (data.success) {
                this.addChatMessage('ai', data.response);
            } else {
                this.showNotification('Failed to get AI response', 'error');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        }
    }

    addChatMessage(sender, message, isHTML = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-gray-700 rounded-lg p-3 text-sm animate-pulse';
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-user text-green-400 mt-1 mr-2"></i>
                    <div>
                        <p class="font-semibold text-green-400">You</p>
                        <p class="text-gray-300">${this.escapeHtml(message)}</p>
                    </div>
                </div>
            `;
        } else if (sender === 'ai') {
            messageDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-robot text-blue-400 mt-1 mr-2"></i>
                    <div>
                        <p class="font-semibold text-blue-400">AI Assistant</p>
                        <div class="text-gray-300">${isHTML ? message : this.formatMessage(message)}</div>
                    </div>
                </div>
            `;
        } else if (sender === 'system') {
            messageDiv.className = 'mb-3';
            messageDiv.innerHTML = message;
        }

        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Remove animation class after a short delay
        setTimeout(() => {
            messageDiv.classList.remove('animate-pulse');
        }, 500);

        this.chatHistory.push({ sender, message, timestamp: new Date().toISOString() });
    }

    formatMessage(message) {
        // Convert markdown-style formatting to HTML
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-600 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.elements.fileName.textContent = `Selected: ${file.name}`;

        try {
            const text = await file.text();
            this.elements.codeInput.value = text;
            
            // Auto-detect language based on file extension
            const extension = file.name.split('.').pop().toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'mjs': 'javascript',
                'py': 'python',
                'java': 'java',
                'cpp': 'cpp',
                'cc': 'cpp',
                'cxx': 'cpp',
                'cs': 'csharp',
                'php': 'php',
                'rb': 'ruby',
                'go': 'go',
                'rs': 'rust',
                'ts': 'typescript',
                'html': 'html',
                'css': 'css',
                'sql': 'sql'
            };

            if (languageMap[extension]) {
                this.elements.language.value = languageMap[extension];
            }
        } catch (error) {
            console.error('File read error:', error);
            this.showNotification('Failed to read file', 'error');
        }
    }

    clearFileName() {
        if (this.elements.codeInput.value.trim() === '') {
            this.elements.fileName.textContent = '';
            this.elements.fileInput.value = '';
        }
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingModal.classList.remove('hidden');
            this.elements.analyzeBtn.disabled = true;
            this.elements.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
        } else {
            this.elements.loadingModal.classList.add('hidden');
            this.elements.analyzeBtn.disabled = false;
            this.elements.analyzeBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Analyze Code/Error';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-pulse`;
        
        const colors = {
            'error': 'bg-red-600',
            'success': 'bg-green-600',
            'info': 'bg-blue-600',
            'warning': 'bg-yellow-600'
        };

        notification.classList.add(colors[type] || colors.info);
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeErrorAnalyzer();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to analyze
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('analyzeBtn').click();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            document.getElementById('codeInput').value = '';
            document.getElementById('fileName').textContent = '';
            document.getElementById('fileInput').value = '';
        }
    });

    // Add drag and drop functionality
    const codeInput = document.getElementById('codeInput');
    const fileInput = document.getElementById('fileInput');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        codeInput.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        codeInput.addEventListener(eventName, () => {
            codeInput.classList.add('border-blue-500', 'bg-gray-600');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        codeInput.addEventListener(eventName, () => {
            codeInput.classList.remove('border-blue-500', 'bg-gray-600');
        }, false);
    });

    codeInput.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    }, false);
});
